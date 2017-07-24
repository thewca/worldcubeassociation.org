# frozen_string_literal: true

class Timestamp < ApplicationRecord
  self.primary_key = "name"

  def not_after?(other_date)
    date.nil? || date < other_date
  end
end
