# frozen_string_literal: true

class AddUniqueKeyToRanksTables < ActiveRecord::Migration[8.1]
  def change
    add_index :ranks_single, %i[person_id event_id], unique: true
    add_index :ranks_average, %i[person_id event_id], unique: true
  end
end
