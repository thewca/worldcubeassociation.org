# frozen_string_literal: true

class AddUseWcaLiveForScoretaking < ActiveRecord::Migration[6.0]
  def change
    add_column :competitions, :use_wca_live_for_scoretaking, :boolean, null: true, default: false
  end
end
