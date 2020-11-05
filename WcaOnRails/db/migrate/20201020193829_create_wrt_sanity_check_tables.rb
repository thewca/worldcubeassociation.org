# frozen_string_literal: true

class CreateWrtSanityCheckTables < ActiveRecord::Migration[5.2]
  def change
    create_table :sanity_check_categories do |t|
      t.string :name
    end
    create_table :sanity_checks do |t|
      t.integer :sanity_check_category_id
      t.string :topic
      t.text :comments
      t.text :query
    end
    create_table :sanity_check_exclusions do |t|
      t.integer :sanity_check_id
      t.json :exclusion
      t.text :comments
    end
  end
end
