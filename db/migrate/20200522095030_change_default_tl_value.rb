# frozen_string_literal: true

class ChangeDefaultTlValue < ActiveRecord::Migration[5.2]
  def change
    Round
      .joins(:competition_event)
      .where('competition_events.competition_id': Competition.where('year >= 2013'))
      .where(time_limit: nil)
      .update_all(time_limit: TimeLimit.new)
  end
end
