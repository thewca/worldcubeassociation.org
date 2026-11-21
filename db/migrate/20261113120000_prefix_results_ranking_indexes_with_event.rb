# frozen_string_literal: true

class PrefixResultsRankingIndexesWithEvent < ActiveRecord::Migration[8.1]
  def change
    change_table :results, bulk: true do |t|
      t.remove_index %i[best person_name competition_id round_type_id], name: :results_n_results_single_speedup
      t.remove_index %i[average person_name competition_id round_type_id], name: :results_n_results_average_speedup

      t.index %i[event_id best person_name competition_id round_type_id], name: :results_n_results_single_speedup
      t.index %i[event_id average person_name competition_id round_type_id], name: :results_n_results_average_speedup
      t.index %i[event_id country_id best person_name competition_id round_type_id], name: :results_n_results_single_region_speedup
      t.index %i[event_id country_id average person_name competition_id round_type_id], name: :results_n_results_average_region_speedup
    end
  end
end
