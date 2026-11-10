# frozen_string_literal: true

class AttachedImageUsage < ApplicationRecord
  belongs_to :attached_image
  belongs_to :attachable, polymorphic: true
end
