# frozen_string_literal: true

module HasAttachedImages
  extend ActiveSupport::Concern

  included do
    has_many :attached_image_usages, as: :attachable, dependent: :destroy
    has_many :attached_images, through: :attached_image_usages
  end
end
