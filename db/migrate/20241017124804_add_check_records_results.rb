# frozen_string_literal: true

class AddCheckRecordsResults < ActiveRecord::Migration[7.2]
  def change
    create_table :check_records_results do |t|
      t.string :competition_id
      t.string :event_id
      t.datetime :run_start
      t.datetime :run_end
      t.json :results
      t.index [:competition_id, :event_id], unique: true

      t.timestamps
    end
  end
end
