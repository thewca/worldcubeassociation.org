# frozen_string_literal: true

class NullifyCompetitorLimit < ActiveRecord::Migration[5.2]
  def change
    change_column_null(:Competitions, :competitor_limit_enabled, true)
    change_column_default(:Competitions, :competitor_limit_enabled, from: 0, to: nil)
    Competition.where(competitor_limit_enabled: 0).update_all(competitor_limit_enabled: nil)
  end
end
