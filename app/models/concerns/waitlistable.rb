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
      frontend_code: Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION,
      if: :waitlistable?,
    }
    validates :waiting_list_position, numericality: {
      equal_to: 1,
      frontend_code: Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION,
      if: [:waitlistable?, :waiting_list_empty?],
    }
    validates :waiting_list_position, numericality: {
      less_than_or_equal_to: :waiting_list_length,
      frontend_code: Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION,
      if: :waitlistable?,
      unless: :waiting_list_empty?,
    }

    def waiting_list_position?
      @waiting_list_position.present?
    end

    after_save :commit_waitlist_position

    def commit_waitlist_position
      should_add = self.waitlistable? && !self.waiting_list_position?
      should_move = self.waitlistable? && self.waiting_list_position?
      should_remove = !self.waitlistable? && self.waiting_list_position?

      self.waiting_list.add(self.waitlistable_id) if should_add
      self.waiting_list.move_to_position(self.waitlistable_id, @waiting_list_position) if should_move
      self.waiting_list.remove(self.waitlistable_id) if should_remove
    end

    def clear_waitlist_position
      self.waiting_list_position = nil
    end

    # Tells the waitlist entity what ID to waitlist by.
    #   For most objects, this should be `id` by default.
    def waitlistable_id
      self.id
    end

    # Tells the hooks whether the current entity
    #   can be put on the waitlist in the first place.
    def waitlistable?
      false
    end

    def waiting_list_position
      @waiting_list_position ||= self.waiting_list&.position(self.waitlistable_id)
    end
  end
end
