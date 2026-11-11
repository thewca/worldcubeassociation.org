# frozen_string_literal: true

module HasAttachedImages
  extend ActiveSupport::Concern

  included do
    has_many :attached_images, as: :attachable, dependent: :nullify
  end
end
