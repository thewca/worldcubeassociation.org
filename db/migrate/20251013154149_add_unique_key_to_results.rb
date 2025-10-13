# frozen_string_literal: true

class AddUniqueKeyToResults < ActiveRecord::Migration[7.2]
  def change
    add_index :results, %i[competition_id round_id person_id], unique: true, name: 'results_person_uniqueness_speedup'
  end
end
