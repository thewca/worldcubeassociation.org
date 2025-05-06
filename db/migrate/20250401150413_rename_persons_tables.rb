# frozen_string_literal: true

class RenamePersonsTables < ActiveRecord::Migration[7.2]
  def change
    change_table :Persons, bulk: true do |t|
      t.rename :subId, :sub_id
      t.rename :countryId, :country_id
    end

    rename_table :Persons, :persons

    change_table :InboxPersons, bulk: true do |t|
      t.rename :wcaId, :wca_id
      t.rename :countryId, :country_iso2
      t.rename :competitionId, :competition_id
    end

    rename_table :InboxPersons, :inbox_persons
  end
end
