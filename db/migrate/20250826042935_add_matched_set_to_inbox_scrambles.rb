# frozen_string_literal: true

class AddMatchedSetToInboxScrambles < ActiveRecord::Migration[7.2]
  def change
    add_reference :inbox_scrambles, :matched_scramble_set, after: :ordered_index, foreign_key: { to_table: :inbox_scramble_sets }

    reversible do |dir|
      dir.up do
        execute <<~SQL.squish
          UPDATE inbox_scrambles
          SET matched_scramble_set_id = inbox_scramble_set_id
          WHERE matched_scramble_set_id IS NULL
        SQL
      end
    end
  end
end
