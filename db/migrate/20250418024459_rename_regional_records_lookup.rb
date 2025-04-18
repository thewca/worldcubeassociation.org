# frozen_string_literal: true

class RenameRegionalRecordsLookup < ActiveRecord::Migration[7.2]
  def change
    change_table :regional_records_lookup, bulk: true do |t|
      t.rename :resultId, :result_id
      t.rename :countryId, :country_id
      t.rename :eventId, :event_id
      t.rename :competitionEndDate, :competition_end_date
    end
  end
end
