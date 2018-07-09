# frozen_string_literal: true

class AddTimestampsColumnsToCompetitions < ActiveRecord::Migration[5.2]
  def change
    add_timestamps :Competitions, null: true
  end
end
