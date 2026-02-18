# frozen_string_literal: true

class AddLookupDataToRecordsLookup < ActiveRecord::Migration[8.1]
  def change
    reversible do |dir|
      dir.up do
        truncate_tables :regional_records_lookup
      end

      # Upon reversing, the table can just stay as-is
      #   because the schema changes will simply be dropped
    end

    # rubocop:disable Rails/NotNullColumn
    #   It is okay to introduce a non-null column without default value here,
    #   because we've made sure above that the table will definitely be empty.
    change_table :regional_records_lookup, bulk: true do |t|
      t.string :person_id, after: :result_id, null: false
      t.integer :competition_reg_year, after: :competition_end_date, null: false
    end
    # rubocop:enable Rails/NotNullColumn

    reversible do |dir|
      dir.up do
        CheckRegionalRecords.add_to_lookup_table
      end

      # Don't need a `down` because the `change_table` above will just delete the whole column altogether.
    end

    change_table :regional_records_lookup, bulk: true do |t|
      t.index %i[person_id country_id event_id competition_reg_year best result_id], name: :concise_single_speedup
      t.index %i[person_id country_id event_id competition_reg_year average result_id], name: :concise_average_speedup
    end
  end
end
