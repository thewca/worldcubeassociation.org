# frozen_string_literal: true

class ChangeUseWcaLiveToEnum < ActiveRecord::Migration[8.1]
  def change
    add_column :competitions, :scoretaking_software, :integer, default: 0, null: false

    up_only do
      Competition.where(use_wca_live_for_scoretaking: true).update_all(scoretaking_software: :wca_live)
    end

    remove_column :competitions, :use_wca_live_for_scoretaking, :boolean
  end
end
