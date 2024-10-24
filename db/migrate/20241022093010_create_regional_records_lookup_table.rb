# frozen_string_literal: true

class CreateRegionalRecordsLookupTable < ActiveRecord::Migration[7.2]
  def change
    create_table :regional_records_lookup do |t|
      t.string "countryId", null: false
      t.string "eventId", null: false
      t.date "competitionEndDate", null: false
      t.integer "best", default: 0, null: false
      t.integer "average", default: 0, null: false

      t.index [:eventId, :countryId, :best, :competitionEndDate]
      t.index [:eventId, :countryId, :average, :competitionEndDate]
    end
  end
end
