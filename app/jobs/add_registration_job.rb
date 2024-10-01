# frozen_string_literal: true

class AddRegistrationJob < ApplicationJob
  def perform(lane_name, competition_id, user_id, lane_params)
    lane_model_name = lane_name.upcase_first

    lane = Registrations::Lanes::class_eval(lane_model_name)
    if lane.nil?
      raise "No Lane exists for #{lane_model_name}"
    end

    ActiveRecord::Base.transaction do
      lane.process!(lane_params[:competing], user_id, competition_id)
    end
  end
end
