# frozen_string_literal: true

class AddLinkedRoundsModel < ActiveRecord::Migration[7.2]
  def change
    create_table :linked_rounds do |t|
      t.string :wcif_id
      t.timestamps
    end

    add_reference :rounds, :linked_round, foreign_key: true
  end
end
