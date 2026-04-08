# frozen_string_literal: true

class AddQualificationV2FieldsToCe < ActiveRecord::Migration[8.1]
  def change
    change_table :competition_events, bulk: true do |t|
      t.date :qualification_earliest_date, after: :qualification
      t.date :qualification_latest_date, after: :qualification_earliest_date
      t.json :qualification_condition, after: :qualification_latest_date
    end
  end
end
