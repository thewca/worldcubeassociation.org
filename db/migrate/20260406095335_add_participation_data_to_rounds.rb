# frozen_string_literal: true

class AddParticipationDataToRounds < ActiveRecord::Migration[8.1]
  def change
    change_table :rounds, bulk: true do |t|
      t.json :participation_condition, null: true, after: :advancement_condition
      t.references :participation_source, polymorphic: true, null: true, index: false, after: :participation_condition
    end
  end
end
