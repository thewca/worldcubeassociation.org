# frozen_string_literal: true

class CompetitionOrganizer < ApplicationRecord
  include RegistrationsNotifications
  belongs_to :organizer, class_name: "User"
  validates_presence_of :organizer

  belongs_to :competition
  validates_presence_of :competition

  alias_method :user, :organizer
end
