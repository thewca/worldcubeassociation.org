# frozen_string_literal: true

class BookmarkedCompetition < ApplicationRecord
  belongs_to :competition
  belongs_to :user
end
