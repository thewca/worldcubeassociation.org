# frozen_string_literal: true

class AddRegistrationJob < ApplicationJob
  self.queue_adapter = :shoryuken unless Rails.env.local?

  before_enqueue do |job|
    _, competition_id, user_id = job.arguments
    Rails.cache.write(CacheAccess.registration_processing_cache_key(competition_id, user_id), true)
  end

  queue_as EnvConfig.REGISTRATION_QUEUE unless Rails.env.local?

  def self.prepare_task(user_id, competition_id)
    message_deduplication_id = "competing-registration-#{competition_id}-#{user_id}"
    message_group_id = competition_id
    self.set(message_group_id: message_group_id, message_deduplication_id: message_deduplication_id)
  end

  def perform(lane_name, competition_id, user_id, lane_params)
    if Registration.exists?(competition_id: competition_id, user_id: user_id)
      Rails.cache.delete(CacheAccess.registration_processing_cache_key(competition_id, user_id))
      return
    end

    # Symbol and inherit=false keep the lookup inside Registrations::Lanes
    lane = Registrations::Lanes.const_get(lane_name.upcase_first.to_sym, false)

    ActiveRecord::Base.transaction do
      lane.process!(lane_params, user_id, competition_id)
    end
  end
end
