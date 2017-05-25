# frozen_string_literal: true

class PostTag < ApplicationRecord
  belongs_to :post

  before_validation { self.tag = self.tag.strip }

  validates :tag, format: { with: /\A[-a-zA-Z0-9]+\z/, message: "only allows English letters, numbers, and hyphens" }
end
