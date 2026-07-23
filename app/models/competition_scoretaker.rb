# frozen_string_literal: true

class CompetitionScoretaker < ApplicationRecord
  belongs_to :user
  belongs_to :competition

  delegate :name, to: :user
end
