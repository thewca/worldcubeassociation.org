# frozen_string_literal: true

class AddSanityCheckTablesConstraints < ActiveRecord::Migration[5.2]
  def up
    change_column :sanity_checks, :sanity_check_category_id, :bigint, null: false
    add_foreign_key :sanity_checks, :sanity_check_categories

    change_column :sanity_checks, :topic, :string, null: false
    add_index :sanity_checks, :topic, unique: true

    change_column :sanity_checks, :query, :text, null: false

    change_column :sanity_check_categories, :name, :string, null: false
    add_index :sanity_check_categories, :name, unique: true

    change_column :sanity_check_exclusions, :sanity_check_id, :bigint, null: false
    add_foreign_key :sanity_check_exclusions, :sanity_checks

    change_column :sanity_check_exclusions, :exclusion, :text, null: false
  end

  def down
    remove_foreign_key :sanity_checks, :sanity_check_categories
    change_column :sanity_checks, :sanity_check_category_id, :int, null: true

    remove_index :sanity_checks, :topic
    change_column :sanity_checks, :topic, :string, null: true

    change_column :sanity_checks, :query, :text, null: true

    remove_index :sanity_check_categories, :name
    change_column :sanity_check_categories, :name, :string, null: true

    remove_foreign_key :sanity_check_exclusions, :sanity_checks
    change_column :sanity_check_exclusions, :sanity_check_id, :int, null: true

    change_column :sanity_check_exclusions, :exclusion, :json, null: true
  end
end
