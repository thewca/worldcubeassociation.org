# frozen_string_literal: true

class CompetitionOrganizer < ApplicationRecord
  include RegistrationNotifications

  belongs_to :organizer, class_name: "User"
  belongs_to :competition

  alias user organizer
end
