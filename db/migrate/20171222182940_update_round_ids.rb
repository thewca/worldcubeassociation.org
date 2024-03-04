# frozen_string_literal: true

class UpdateRoundIds < ActiveRecord::Migration[5.1]
  def up
    Round.where.not(time_limit: nil).each do |round|
      time_limit = round.time_limit
      next if time_limit.cumulative_round_ids.empty?

      time_limit.cumulative_round_ids = time_limit.cumulative_round_ids.map do |round_id|
        parts = round_id.split("-")
        raise "Invalid round id" if parts.length != 2

        event_id, round_number = parts
        unless round_number.starts_with?("r")
          round_id = "#{event_id}-r#{round_number}"
        end

        round_id
      end

      round.update!(time_limit: time_limit)
    end
  end
end
