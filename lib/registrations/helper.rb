# frozen_string_literal: true

module Registrations
  module Helper
    REGISTRATION_STATES = %w[pending waiting_list accepted cancelled rejected].freeze
    ADMIN_ONLY_STATES = %w[pending waiting_list accepted rejected].freeze # Only admins are allowed to change registration state to one of these states
    MIGHT_ATTEND_STATES = %w[pending waiting_list accepted].freeze

    def self.action_type(request, current_user)
      self_updating = request[:user_id] == current_user
      status = request.dig('competing', 'status')
      if status == 'cancelled'
        return self_updating ? 'Competitor delete' : 'Admin delete'
      end
      if status == 'rejected'
        return 'Admin reject'
      end
      self_updating ? 'Competitor update' : 'Admin update'
    end
  end
end
