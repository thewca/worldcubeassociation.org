# frozen_string_literal: true

require 'active_support/concern'

module Waitlistable
  extend ActiveSupport::Concern

  included do
    attr_accessor :new_waitlist_position

    def new_waitlist_position?
      self.new_waitlist_position.present?
    end

    after_commit :clear_waitlist_position, on: :save

    def clear_waitlist_position
      self.new_waitlist_position = nil
    end

    # Tells the waitlist entity what ID to waitlist by.
    #   For most objects, this should be `id` by default.
    def waitlistable_id
      self.id
    end

    # Tells the hooks whether the current entity
    #   can be put on the waitlist in the first place.
    def waitlistable?
      true
    end

    def waiting_list_position
      self.waiting_list.position(self.waitlistable_id)
    end
  end
end
