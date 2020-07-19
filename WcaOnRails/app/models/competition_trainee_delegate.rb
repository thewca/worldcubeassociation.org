# frozen_string_literal: true

class CompetitionTraineeDelegate < ApplicationRecord
  belongs_to :trainee_delegate, class_name: "User"
  validates_presence_of :trainee_delegate

  belongs_to :competition
  validates_presence_of :competition
end
