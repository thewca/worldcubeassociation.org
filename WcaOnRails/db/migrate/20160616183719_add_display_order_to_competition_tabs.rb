# frozen_string_literal: true

class AddDisplayOrderToCompetitionTabs < ActiveRecord::Migration
  def change
    add_column :competition_tabs, :display_order, :integer
    add_index :competition_tabs, [:display_order, :competition_id], unique: true
  end
end
