# frozen_string_literal: true

class RenameResultsColumns < ActiveRecord::Migration[7.2]
  def change
    change_table :Results, bulk: true do |t|
      t.rename :personId, :person_id
      t.rename :personName, :person_name
      t.rename :countryId, :country_id
      t.rename :competitionId, :competition_id
      t.rename :eventId, :event_id
      t.rename :roundTypeId, :round_type_id
      t.rename :formatId, :format_id
      t.rename :regionalSingleRecord, :regional_single_record
      t.rename :regionalAverageRecord, :regional_average_record
    end

    rename_table :Results, :results

    change_table :InboxResults, bulk: true do |t|
      t.rename :personId, :person_id
      t.rename :competitionId, :competition_id
      t.rename :eventId, :event_id
      t.rename :roundTypeId, :round_type_id
      t.rename :formatId, :format_id
    end

    rename_table :InboxResults, :inbox_results
  end
end
