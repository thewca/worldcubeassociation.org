# frozen_string_literal: true

class CompetitionProducts < ApplicationRecord
  has_many :invoice_items, as: :productable
  belongs_to :competition
end
