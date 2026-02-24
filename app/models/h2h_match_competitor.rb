# frozen_string_literal: true

class H2hMatchCompetitor < ApplicationRecord
  has_many :h2h_attempts, dependent: :destroy
  belongs_to :h2h_match
  belongs_to :user
end
