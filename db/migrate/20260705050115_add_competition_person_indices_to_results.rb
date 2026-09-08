# frozen_string_literal: true

class AddCompetitionPersonIndicesToResults < ActiveRecord::Migration[7.0]
  def change
    add_index :results, %i[competition_id person_id]
    add_index :inbox_results, %i[competition_id person_id]
  end
end
