# frozen_string_literal: true

class AddRegistrationJob < ApplicationJob
  def perform(lane, competition_id, user_id, lane_params)
    ActiveRecord::Base.transaction do
      if lane == "competing"
        Registrations::CompetingLane.create!(lane_params, user_id, competition_id)
      end
    end
  end
end
