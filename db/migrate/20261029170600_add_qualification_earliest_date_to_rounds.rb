# frozen_string_literal: true

class AddQualificationEarliestDateToRounds < ActiveRecord::Migration[8.1]
  def change
    add_column :competition_events, :qualification_earliest_date, :date, null: true, after: :qualification_latest_date
  end
end
