# frozen_string_literal: true

class ChangeCompetitorLimitReasonTypeToText < ActiveRecord::Migration[5.0]
  def change
    change_column :Competitions, :competitor_limit_reason, :text
  end
end
