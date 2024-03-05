# frozen_string_literal: true

class AddCompetitorLimitToCompetitions < ActiveRecord::Migration[5.0]
  def change
    add_column :Competitions, :competitor_limit_enabled, :boolean, null: false, default: 0
    add_column :Competitions, :competitor_limit, :integer
    add_column :Competitions, :competitor_limit_reason, :string
  end
end
