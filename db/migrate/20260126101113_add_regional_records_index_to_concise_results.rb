# frozen_string_literal: true

class AddRegionalRecordsIndexToConciseResults < ActiveRecord::Migration[8.1]
  def change
    add_index :concise_single_results, %i[event_id country_id best], name: "regional_records_speedup"
    add_index :concise_average_results, %i[event_id country_id average], name: "regional_records_speedup"
  end
end
