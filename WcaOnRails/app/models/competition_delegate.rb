# frozen_string_literal: true

class CompetitionDelegate < ApplicationRecord
  include RegistrationNotifications
  belongs_to :delegate, class_name: "User"
  validates_presence_of :delegate

  belongs_to :competition
  validates_presence_of :competition

  alias_method :user, :delegate
end
