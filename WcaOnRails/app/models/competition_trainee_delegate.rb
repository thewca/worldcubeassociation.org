# frozen_string_literal: true

class CompetitionTraineeDelegate < ApplicationRecord
  include RegistrationNotifications

  belongs_to :trainee_delegate, class_name: "User"
  belongs_to :competition

  alias_method :user, :trainee_delegate
end
