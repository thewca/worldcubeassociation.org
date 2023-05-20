# frozen_string_literal: true

class RemovePersonsView < ActiveRecord::Migration[7.0]
  def change
    execute 'DROP VIEW rails_persons;'
    rename_column :Persons, :id, :wca_id
    rename_column :Persons, :rails_id, :id
  end
end
