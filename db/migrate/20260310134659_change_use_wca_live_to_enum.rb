# frozen_string_literal: true

class ChangeUseWcaLiveToEnum < ActiveRecord::Migration[8.1]
  def up
    add_column :competitions, :use_wca_live_for_scoretaking_tmp, :integer, default: 0, null: false

    execute <<~SQL
      UPDATE competitions
      SET use_wca_live_for_scoretaking_tmp =
        CASE
          WHEN use_wca_live_for_scoretaking = TRUE THEN 1
          ELSE 0
        END
    SQL

    remove_column :competitions, :use_wca_live_for_scoretaking
    rename_column :competitions, :use_wca_live_for_scoretaking_tmp, :software_for_scoretaking
  end

  def down
    add_column :competitions, :use_wca_live_for_scoretaking_tmp, :boolean, default: false, null: false

    execute <<~SQL
      UPDATE competitions
      SET use_wca_live_for_scoretaking_tmp =
        CASE
          WHEN software_for_scoretaking = 1 THEN TRUE
          ELSE FALSE
        END
    SQL

    remove_column :competitions, :software_for_scoretaking
    rename_column :competitions, :use_wca_live_for_scoretaking_tmp, :use_wca_live_for_scoretaking
  end
end
