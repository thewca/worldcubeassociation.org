# frozen_string_literal: true

class BookmarkedCompetition < ApplicationRecord
  belongs_to :competition
  validates_presence_of :competition

  belongs_to :user
  validates_presence_of :user
end
