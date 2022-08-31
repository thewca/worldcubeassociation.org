# frozen_string_literal: true

class AddUseWcaLiveForScoretaking < ActiveRecord::Migration[6.0]
  def change
    add_column :competitions, :use_wca_live_for_scoretaking, :boolean, null: false, default: true
    Competition.update_all(use_wca_live_for_scoretaking: false)
  end
end
