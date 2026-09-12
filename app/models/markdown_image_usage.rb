# frozen_string_literal: true

class MarkdownImageUsage < ApplicationRecord
  belongs_to :markdown_image
  belongs_to :attachable, polymorphic: true
end
