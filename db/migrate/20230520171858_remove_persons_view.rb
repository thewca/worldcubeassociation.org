# frozen_string_literal: true

class RemovePersonsView < ActiveRecord::Migration[7.0]
  def change
    execute 'DROP VIEW rails_persons;'
    rename_column :Persons, :id, :wca_id
    rename_column :Persons, :rails_id, :id
    # Reorder columns to make the data more accessible in Rails and for future schema changes
    change_column :Persons, :id, :integer, null: false, first: true
  end
end
