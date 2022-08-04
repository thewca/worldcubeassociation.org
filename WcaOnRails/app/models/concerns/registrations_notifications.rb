# frozen_string_literal: true

require 'active_support/concern'

module RegistrationsNotifications
  extend ActiveSupport::Concern

  included do
    after_create { update_attribute(:receive_registration_emails, user.registrations_notifications) }
  end
end
