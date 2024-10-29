# frozen_string_literal: true

class CreateRegionalRecordsLookupTable < ActiveRecord::Migration[7.2]
  def change
    create_table :regional_records_lookup do |t|
      t.references :Results, foreign_key: true, null: false, type: :int
      t.string "countryId", null: false
      t.string "eventId", null: false
      t.date "competitionEndDate", null: false
      t.integer "best", default: 0, null: false
      t.integer "average", default: 0, null: false

      t.index [:eventId, :countryId, :best, :competitionEndDate]
      t.index [:eventId, :countryId, :average, :competitionEndDate]
    end

    # Small hack because Rails doesn't support custom `t.references` names
    #   but our Results tables have their own nomenclature
    rename_column :regional_records_lookup, :Results_id, :resultId
  end
end
