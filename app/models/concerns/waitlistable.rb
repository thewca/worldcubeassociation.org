# frozen_string_literal: true

require 'active_support/concern'

module Waitlistable
  extend ActiveSupport::Concern

  included do
    delegate :empty?, :length, to: :waiting_list, prefix: true

    attr_writer :waiting_list_position

    validates :waiting_list_position, numericality: {
      only_integer: true,
      greater_than_or_equal_to: 1,
      allow_nil: true,
      frontend_code: Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION,
      if: :waitlistable?,
    }
    validates :waiting_list_position, numericality: {
      equal_to: 1,
      allow_nil: true,
      frontend_code: Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION,
      if: [:waitlistable?, :waiting_list_empty?],
    }
    validates :waiting_list_position, numericality: {
      less_than_or_equal_to: :waiting_list_length,
      allow_nil: true,
      frontend_code: Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION,
      if: :waitlistable?,
      unless: :waiting_list_empty?,
    }

    validates :waitlistable?, presence: { if: :waiting_list_position?, frontend_code: Registrations::ErrorCodes::INVALID_REQUEST_DATA }

    def waiting_list_position?
      @waiting_list_position.present?
    end

    # TODO: V3-REG cleanup: Enable this hook so that we can actually have the updating function for free
    # after_save :commit_waitlist_position

    def commit_waitlist_position
      should_add = self.waitlistable? && !self.waiting_list_position?
      should_move = self.waitlistable? && self.waiting_list_position?
      should_remove = !self.waitlistable? && self.waiting_list_position?

      self.waiting_list.add(self) if should_add
      self.waiting_list.move_to_position(self, self.waiting_list_position) if should_move
      self.waiting_list.remove(self) if should_remove
    end

    def clear_waitlist_position
      @waiting_list_position = nil
    end

    # Tells the hooks whether the current entity
    #   can be put on the waitlist in the first place.
    def waitlistable?
      false
    end

    def waiting_list_position
      @waiting_list_position ||= self.waiting_list&.position(self)
    end
  end
end
