# frozen_string_literal: true

class CompetitionTraineeDelegate < ApplicationRecord
  include RegistrationNotifications
  belongs_to :trainee_delegate, class_name: "User"
  validates_presence_of :trainee_delegate

  belongs_to :competition
  validates_presence_of :competition

  alias_method :user, :trainee_delegate
end
