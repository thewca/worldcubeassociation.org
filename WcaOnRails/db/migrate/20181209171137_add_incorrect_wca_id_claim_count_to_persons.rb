# frozen_string_literal: true

class AddIncorrectWcaIdClaimCountToPersons < ActiveRecord::Migration[5.2]
  def change
    add_column :Persons, :incorrect_wca_id_claim_count, :integer, null: false, default: 0
    execute <<-SQL
      ALTER VIEW rails_persons
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
        comments,
        incorrect_wca_id_claim_count
      FROM Persons;
    SQL
  end
end
