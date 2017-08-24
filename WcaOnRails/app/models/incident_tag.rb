# frozen_string_literal: true

class IncidentTag < ApplicationRecord
  belongs_to :incident

  validates_presence_of :incident

  before_validation { self.tag = self.tag.strip }

  validates :tag, format: { with: /\A[-+a-zA-Z0-9]+\z/, message: "only allows English letters, numbers, hyphens, and '+'" }
end
