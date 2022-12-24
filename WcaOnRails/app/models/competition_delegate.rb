# frozen_string_literal: true

class CompetitionDelegate < ApplicationRecord
  include RegistrationNotifications

  belongs_to :delegate, class_name: "User"
  belongs_to :competition

  alias_method :user, :delegate
end
