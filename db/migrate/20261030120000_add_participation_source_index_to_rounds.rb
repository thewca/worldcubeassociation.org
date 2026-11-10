# frozen_string_literal: true

class AddParticipationSourceIndexToRounds < ActiveRecord::Migration[8.1]
  def change
    add_index :rounds, %i[participation_source_type participation_source_id], name: "index_rounds_on_participation_source"
  end
end
