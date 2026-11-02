# SD-11's concurrent run: two test workers, each with its own database and
# both with the dummy app's one tmp folder, as Spree's parallel CI workers are.
# Each worker has a store with the same code and one product of its own. In
# each round both workers start a product export in the same wall-clock second
# and run it with Spree's own `generate`, nothing stubbed and no step reordered.
# Each records whether its export got its own rows, the other worker's rows,
# or failed, and with which error. Run from spree/core in two shells at once (see README.md):
#
#   SD11_START=<epoch second> SD11_WORKER=alpha TEST_ENV_NUMBER=  bundle exec rspec <this file>
#   SD11_START=<epoch second> SD11_WORKER=beta  TEST_ENV_NUMBER=2 bundle exec rspec <this file>
#
# The control gives each worker a store code of its own (SD11_STORE_CODE), so
# their exports' file names differ.
require 'spec_helper'

RSpec.describe Spree::Exports::Products, 'run by two workers at once', type: :model, if: ENV['SD11_START'] do
  rounds = Integer(ENV.fetch('SD11_ROUNDS', '40'))
  start = Integer(ENV.fetch('SD11_START', '0'))
  worker = ENV.fetch('SD11_WORKER')
  names = { 'alpha' => 'Alpha Collision Tee', 'beta' => 'Beta Collision Tee' }
  own_name = names.fetch(worker)
  other_name = names.values.find { |name| name != own_name }

  it "records what #{rounds} exports got" do
    store = create(:store, code: ENV.fetch('SD11_STORE_CODE', 'sd11-collision'))
    create(:product, name: own_name, store: store)

    results = (0...rounds).map do |round|
      sleep_until = start + (round * 2) + 0.2
      sleep(sleep_until - Time.now.to_f) if sleep_until > Time.now.to_f

      export = create(:product_export, store: store, user: nil)
      outcome =
        begin
          export.generate
          rows = export.attachment.download
          if rows.include?(own_name) && !rows.include?(other_name)
            'own rows'
          elsif rows.include?(other_name) && !rows.include?(own_name)
            "the other worker's rows"
          else
            'neither or both'
          end
        rescue StandardError => error
          "failed: #{error.class}"
        end

      { round: round, worker: worker, created_at: export.created_at.utc.iso8601(3),
        file: export.export_file_name, outcome: outcome }
    end

    output = ENV.fetch('SD11_OUT')
    File.write(File.join(output, "#{worker}.json"), JSON.pretty_generate(results))
    puts results.group_by { |result| result[:outcome] }.transform_values(&:size).inspect
  end
end
