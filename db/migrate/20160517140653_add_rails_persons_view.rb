# frozen_string_literal: true

class AddRailsPersonsView < ActiveRecord::Migration
  def change
    execute "ALTER TABLE Persons DROP PRIMARY KEY;"
    add_index :Persons, [:id, :subId], unique: true
    add_column :Persons, :rails_id, :primary_key

    execute <<-SQL
      CREATE VIEW rails_persons
      AS SELECT
        rails_id AS id,
        id AS wca_id,
        subId,
        name,
        countryId,
        gender,
        year,
        month,
        day,
        comments
      FROM Persons;
    SQL
  end
end
