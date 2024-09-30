# frozen_string_literal: true

class AddRegistrationJob < ApplicationJob
  def perform(lane, competition_id, user_id, lane_params)
    ActiveRecord::Base.transaction do
      if lane == "competing"
        registration = Registration.build(competition_id: competition_id, user_id: user_id)
        Registrations::CompetingLane.create!(registration, lane_params[:competing], user_id, competition_id)
      end
    end
  end
end
