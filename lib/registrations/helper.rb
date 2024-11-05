# frozen_string_literal: true

module Registrations
  module Helper
    # TODO: V3-REG Cleanup. Change to symbol when introducing the registration_status enum
    STATUS_PENDING = "pending"
    STATUS_WAITING_LIST = "waiting_list"
    STATUS_ACCEPTED = "accepted"
    # TODO: V3-REG Cleanup. Remove deleted when we switch to the competing_status enum
    STATUS_DELETED = "deleted"
    STATUS_CANCELLED = "canceled"
    STATUS_REJECTED = "rejected"

    REGISTRATION_STATES = [STATUS_ACCEPTED, STATUS_DELETED, STATUS_CANCELLED, STATUS_PENDING, STATUS_REJECTED, STATUS_WAITING_LIST].freeze # TODO: Change deleted to canceled when v1 is retired
    ADMIN_ONLY_STATES = [STATUS_PENDING, STATUS_WAITING_LIST, STATUS_ACCEPTED, STATUS_REJECTED].freeze # Only admins are allowed to change registration state to one of these states
    MIGHT_ATTEND_STATES = [STATUS_PENDING, STATUS_WAITING_LIST, STATUS_ACCEPTED].freeze

    def self.action_type(request, current_user_id)
      self_updating = request[:user_id].to_i == current_user_id
      status = request.dig('competing', 'status')
      if [STATUS_DELETED, STATUS_CANCELLED].include?(status)
        return self_updating ? 'Competitor delete' : 'Admin delete'
      end
      if status == STATUS_REJECTED
        return 'Admin reject'
      end
      self_updating ? 'Competitor update' : 'Admin update'
    end

    def self.user_qualification_data(user, date)
      return [] unless user.person.present?

      # Compile singles
      best_singles_by_cutoff = user.person.best_singles_by(date)
      single_qualifications = best_singles_by_cutoff.map do |event, time|
        self.qualification_data(event, :single, time, date)
      end

      # Compile averages
      best_averages_by_cutoff = user.person&.best_averages_by(date)
      average_qualifications = best_averages_by_cutoff.map do |event, time|
        self.qualification_data(event, :average, time, date)
      end

      single_qualifications + average_qualifications
    end

    def self.qualification_data(event, type, time, date)
      raise ArgumentError.new("'type' may only contain the symbols `:single` or `:average`") unless [:single, :average].include?(type)
      {
        eventId: event,
        type: type,
        best: time,
        on_or_before: date.iso8601,
      }
    end
  end
end
