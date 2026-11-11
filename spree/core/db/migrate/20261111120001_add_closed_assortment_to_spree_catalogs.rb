class AddClosedAssortmentToSpreeCatalogs < ActiveRecord::Migration[8.1]
  def change
    add_column :spree_catalogs, :closed_assortment, :boolean, null: false, default: false
  end
end
