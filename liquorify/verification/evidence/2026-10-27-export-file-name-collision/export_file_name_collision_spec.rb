# SD-11's reproduction in Spree core's own test setup: what two product
# exports for one store, created within the same second, do with their
# temporary file. Run from spree/core (see README.md beside this file):
#
#   bundle exec rspec ../../liquorify/verification/evidence/2026-10-27-export-file-name-collision/export_file_name_collision_spec.rb
#
# It calls the export's own steps in the order two overlapping jobs can take
# them. It does not show how often jobs overlap; concurrent_exports_spec.rb
# runs them at the same time instead.
require 'spec_helper'

RSpec::Matchers.define_negated_matcher :exclude, :include

RSpec.describe Spree::Exports::Products, 'temporary file', type: :model do
  let(:store) { @default_store }
  let(:user) { create(:admin_user) }
  let!(:alpha) { create(:product, name: 'Alpha Collision Tee', store: store) }
  let!(:beta) { create(:product, name: 'Beta Collision Tee', store: store) }

  let(:second_start) { Time.utc(2026, 10, 27, 1, 0, 0) }
  let(:first) { Timecop.freeze(second_start + 0.1) { export_named('Alpha') } }
  let(:second) { Timecop.freeze(second_start + 0.9) { export_named('Beta') } }

  def export_named(name)
    create(:product_export, store: store, user: user, search_params: { name_cont: name })
  end

  def in_store(&block)
    Spree::Current.set(store: store, &block)
  end

  it 'is one path for both exports' do
    expect(first.id).not_to eq(second.id)
    expect(first.export_tmp_file_path).to eq(second.export_tmp_file_path)
    expect(first.export_file_name).to eq("products-#{store.code}-20261027010000.csv")
  end

  it 'gives each export its own rows when the two runs do not overlap' do
    first.generate
    second.generate

    expect(first.attachment.download).to include('Alpha Collision Tee').and exclude('Beta Collision Tee')
    expect(second.attachment.download).to include('Beta Collision Tee').and exclude('Alpha Collision Tee')
  end

  it 'gives the first export the second one\'s rows, and fails the second, when the runs overlap' do
    in_store { first.generate_csv }
    in_store { second.generate_csv }
    in_store { first.handle_attachment }

    expect(first.attachment.download).to include('Beta Collision Tee').and exclude('Alpha Collision Tee')
    expect { in_store { second.handle_attachment } }.to raise_error(Errno::ENOENT)
    expect(second.reload.attachment).not_to be_attached
  end
end
