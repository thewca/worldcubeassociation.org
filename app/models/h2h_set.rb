# frozen_string_literal: true

class H2hSet < ApplicationRecord
  belongs_to :h2h_match
  has_many :h2h_attempts, dependent: :destroy
end
