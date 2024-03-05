# frozen_string_literal: true

class IncidentTag < ApplicationRecord
  belongs_to :incident

  before_validation { self.tag = self.tag.strip }

  validates :tag, format: { with: Taggable::TAG_REGEX, message: Taggable::TAG_REGEX_MESSAGE }
end
