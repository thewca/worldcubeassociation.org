# frozen_string_literal: true

class CompetitionDelegate < ApplicationRecord
  belongs_to :delegate, class_name: "User"
  validates_presence_of :delegate

  belongs_to :competition
  validates_presence_of :competition
end
