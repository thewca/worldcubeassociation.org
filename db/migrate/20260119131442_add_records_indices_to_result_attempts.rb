# frozen_string_literal: true

class AddRecordsIndicesToResultAttempts < ActiveRecord::Migration[8.1]
  # rubocop:disable Rails/BulkChangeTable
  def change
    add_index :result_attempts, :value
    add_index :results, %i[average person_name competition_id round_type_id], name: "results_n_results_average_speedup"
    add_index :results, %i[best person_name competition_id round_type_id], name: "results_n_results_single_speedup"
  end
  # rubocop:enable Rails/BulkChangeTable
end
