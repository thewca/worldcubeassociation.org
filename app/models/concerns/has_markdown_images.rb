# frozen_string_literal: true

module HasMarkdownImages
  extend ActiveSupport::Concern

  included do
    has_many :markdown_image_usages, as: :attachable, dependent: :destroy
    has_many :markdown_images, through: :markdown_image_usages
  end
end
