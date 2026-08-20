# frozen_string_literal: true

class H2hMatch < ApplicationRecord
  belongs_to :round
  has_many :h2h_match_competitors, dependent: :destroy
  has_many :users, through: :h2h_match_competitors
  has_many :h2h_sets, dependent: :destroy
end
