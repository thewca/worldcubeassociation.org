# frozen_string_literal: true

class AddRecordsIndexToConciseResults < ActiveRecord::Migration[8.1]
  def change
    add_index :concise_single_results, %i[event_id best], name: "mixed_records_speedup"
    add_index :concise_average_results, %i[event_id average], name: "mixed_records_speedup"
  end
end
