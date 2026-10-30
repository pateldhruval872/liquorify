# Transactional tests pin one connection that every thread shares, and a
# transaction never waits on its own FOR UPDATE, so threads sharing it
# interleave freely: an example meant to race proves nothing and fails at
# random. Real parallel connections need the transaction wrapper off.
#
# Everything such an example writes is committed, and the factories commit
# side rows nobody names (a tax category, a delivery profile) that change what
# later examples in the worker see. So every row the example adds is removed,
# from whichever table it landed in, even when the example fails.
RSpec.shared_context 'with committed records' do
  self.use_transactional_tests = false

  around do |example|
    preexisting_ids = committed_ids_by_table
    example.run
  ensure
    delete_rows_added_since(preexisting_ids)
  end

  def committed_ids_by_table
    ActiveRecord::Base.with_connection do |connection|
      connection.tables.each_with_object({}) do |table_name, ids_by_table|
        next unless connection.schema_cache.columns_hash(table_name).key?('id')

        table = Arel::Table.new(table_name)
        ids_by_table[table_name] = connection.select_values(table.project(table[:id]))
      end
    end
  end

  def delete_rows_added_since(ids_by_table)
    ActiveRecord::Base.with_connection do |connection|
      ids_by_table.each do |table_name, ids|
        table = Arel::Table.new(table_name)
        connection.delete(Arel::DeleteManager.new.from(table).where(table[:id].not_in(ids)))
      end
    end
  end

  # Runs each action on its own thread and connection, as separate requests
  # would, and returns what each returned, in order. An action loads its
  # records and returns the callable that acts on them, so every thread has
  # done its reads before any of them acts.
  #
  # Every thread has finished before this returns or raises, so nothing is
  # still writing when the example's cleanup runs. If threads failed, the
  # error of the earliest failing action in the list is raised then. An
  # action that fails while loading stops the others from acting at all.
  def run_together(actions)
    # Frees this thread's connection so the pool can serve every thread.
    ActiveRecord::Base.connection_pool.release_connection
    ready = Concurrent::CountDownLatch.new(actions.size)
    loading_failed = Concurrent::AtomicBoolean.new(false)

    threads = actions.map do |action|
      Thread.new do
        # The error is raised below, once every thread is done.
        Thread.current.report_on_exception = false

        ActiveRecord::Base.connection_pool.with_connection do
          begin
            act = action.call
          rescue Exception
            loading_failed.make_true
            raise
          ensure
            ready.count_down
          end

          # A thread that stopped waiting would act on its own and prove
          # nothing, so it skips acting and the example fails below.
          next :not_ready unless ready.wait(5)
          next :not_acted if loading_failed.true?

          act.call
        end
      end
    end

    outcomes = threads.map do |thread|
      { value: thread.value }
    rescue Exception => error
      { error: error }
    end

    error = outcomes.find { |outcome| outcome.key?(:error) }
    raise error[:error] if error

    results = outcomes.pluck(:value)
    raise 'Not every thread was ready within 5 seconds, so the actions did not overlap' if results.include?(:not_ready)

    results
  end

  # The database's id for this thread's connection, which
  # wait_until_waiting_for_a_lock watches.
  def database_session_id
    connection = ActiveRecord::Base.connection
    connection.select_value(postgres?(connection) ? 'SELECT pg_backend_pid()' : 'SELECT CONNECTION_ID()')
  end

  # Returns once one of the given database sessions is blocked waiting for a
  # row lock, so a thread can hold its lock until the race it sets up has
  # really started. Other sessions on the server are ignored.
  def wait_until_waiting_for_a_lock(*session_ids, timeout: 5)
    connection = ActiveRecord::Base.connection
    waiting = if postgres?(connection)
                locks = Arel::Table.new(:pg_locks)
                locks.project(Arel.star.count).where(locks[:granted].eq(false).and(locks[:pid].in(session_ids)))
              else
                # Not information_schema.innodb_trx: MySQL refreshes that only
                # when nobody has read it for a tenth of a second.
                lock_waits = Arel::Table.new('performance_schema.data_lock_waits')
                threads = Arel::Table.new('performance_schema.threads')
                lock_waits.project(Arel.star.count)
                          .join(threads).on(threads[:thread_id].eq(lock_waits[:requesting_thread_id]))
                          .where(threads[:processlist_id].in(session_ids))
              end
    deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + timeout

    until connection.select_value(waiting).to_i.positive?
      raise "No session of #{session_ids.inspect} waited for a lock within #{timeout} seconds" if Process.clock_gettime(Process::CLOCK_MONOTONIC) > deadline

      sleep 0.05
    end
  end

  def postgres?(connection)
    connection.adapter_name.match?(/postg/i)
  end
end
