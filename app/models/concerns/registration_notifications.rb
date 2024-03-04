# frozen_string_literal: true

require 'active_support/concern'

module RegistrationNotifications
  extend ActiveSupport::Concern

  included do
    after_create { update_attribute(:receive_registration_emails, user.registration_notifications_enabled) }
  end
end
