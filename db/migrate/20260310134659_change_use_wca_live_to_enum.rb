# frozen_string_literal: true

class ChangeUseWcaLiveToEnum < ActiveRecord::Migration[8.1]
  def change
    add_column :competitions, :software_for_scoretaking, :integer, default: 0, null: false

    up_only do
      execute <<~SQL.squish
        UPDATE competitions
        SET software_for_scoretaking =
          CASE
            WHEN use_wca_live_for_scoretaking = TRUE THEN 1
            ELSE 0
          END
      SQL
    end

    remove_column :competitions, :use_wca_live_for_scoretaking, :boolean
  end
end
