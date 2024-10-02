module Registrations
  module Helper
    REGISTRATION_STATES = %w[pending waiting_list accepted cancelled rejected].freeze
    ADMIN_ONLY_STATES = %w[pending waiting_list accepted rejected].freeze # Only admins are allowed to change registration state to one of these states
    MIGHT_ATTEND_STATES = %w[pending waiting_list accepted].freeze
  end
end
