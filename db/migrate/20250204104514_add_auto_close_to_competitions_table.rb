# frozen_string_literal: true

class AddAutoCloseToCompetitionsTable < ActiveRecord::Migration[7.2]
  def change
    add_column :Competitions, :auto_close_threshold, :integer, default: 0, null: false
  end
end
