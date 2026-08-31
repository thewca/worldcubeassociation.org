# frozen_string_literal: true

class RemoveWcifIdFromLinkedRounds < ActiveRecord::Migration[8.1]
  def change
    remove_column :linked_rounds, :wcif_id, type: :string
  end
end
