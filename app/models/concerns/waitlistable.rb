# frozen_string_literal: true

require 'active_support/concern'

module Waitlistable
  extend ActiveSupport::Concern

  included do
    delegate :empty?, :length, to: :waiting_list, prefix: true
    delegate :present?, :persisted?, to: :waiting_list, prefix: true, allow_nil: true

    attr_accessor :tracked_waitlist_position

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
      if: [:waitlistable?, :waiting_list_present?, :waiting_list_empty?],
    }
    validates :waiting_list_position, numericality: {
      less_than_or_equal_to: :waiting_list_length,
      allow_nil: true,
      frontend_code: Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION,
      if: [:waitlistable?, :waiting_list_present?],
      unless: :waiting_list_empty?,
    }

    validates :waitlistable?, presence: { if: :waitlist_position_changed?, frontend_code: Registrations::ErrorCodes::INVALID_REQUEST_DATA }
    validates :waiting_list_present?, presence: { if: :waitlist_position_changed?, frontend_code: Registrations::ErrorCodes::INVALID_REQUEST_DATA }

    after_save :commit_waitlist_position, if: :waiting_list_persisted?

    private def commit_waitlist_position
      self.apply_to_waiting_list(self.waiting_list_position)
    end

    after_commit :clear_tracked_waitlist_position!

    private def clear_tracked_waitlist_position!
      self.tracked_waitlist_position = nil
    end

    # Tells the hooks whether the current entity
    #   can be put on the waitlist in the first place.
    def waitlistable?
      false
    end

    def waiting_list_position
      self.tracked_waitlist_position || self.waiting_list&.position(self)
    end

    def waiting_list_position?
      self.waiting_list_position.present?
    end

    def waitlist_position_changed?
      self.tracked_waitlist_position.present?
    end

    def waiting_list_position=(target_position)
      self.tracked_waitlist_position = target_position

      self.apply_to_waiting_list(target_position) if self.persisted? && waiting_list_persisted?
    end

    private def apply_to_waiting_list(target_position)
      should_add = self.waitlistable? && target_position.nil?
      should_move = self.waitlistable? && target_position.present?
      should_remove = !self.waitlistable? && target_position.present?

      self.waiting_list.add(self) if should_add
      self.waiting_list.move_to_position(self, target_position) if should_move
      self.waiting_list.remove(self) if should_remove
    end
  end
end
