# frozen_string_literal: true

class LinkedRounds < ApplicationRecord
  has_many :rounds

  def results
    rounds.flat_map { it.results }
  end
end
