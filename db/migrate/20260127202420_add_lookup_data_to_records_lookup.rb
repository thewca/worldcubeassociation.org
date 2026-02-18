# frozen_string_literal: true

class AddLookupDataToRecordsLookup < ActiveRecord::Migration[8.1]
  def change
    change_table :regional_records_lookup, bulk: true do |t|
      t.string :person_id, after: :result_id
      t.integer :competition_reg_year, after: :competition_end_date
    end

    reversible do |dir|
      dir.up do
        execute <<~SQL.squish
          UPDATE regional_records_lookup rrl
          INNER JOIN results ON rrl.result_id = results.id
          INNER JOIN competitions ON results.competition_id = competitions.id
          SET rrl.competition_reg_year = YEAR(competitions.start_date), rrl.person_id = results.person_id
          WHERE 1
        SQL
      end

      # Don't need a `down` because the `change_table` above will just delete the whole column altogether.
    end

    change_column_null :regional_records_lookup, :competition_reg_year, false
    change_column_null :regional_records_lookup, :person_id, false

    change_table :regional_records_lookup, bulk: true do |t|
      t.index %i[person_id country_id event_id competition_reg_year best result_id], name: :concise_single_speedup
      t.index %i[person_id country_id event_id competition_reg_year average result_id], name: :concise_average_speedup
    end
  end
end
