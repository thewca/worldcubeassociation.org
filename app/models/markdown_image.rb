# frozen_string_literal: true

# An image uploaded through a markdown editor. Wrapping the blob in a record is
# what lets us validate it: UploadController used to create bare blobs, which
# ActiveStorage has no way to run validations on, so any file at all could be
# uploaded and then linked to under our own domain.
class MarkdownImage < ApplicationRecord
  belongs_to :uploaded_by, class_name: "User", optional: true

  has_one_attached :image

  MAX_UPLOAD_SIZE = 5.megabytes

  validates :image,
            presence: true,
            content_type: ActiveStorage.web_image_content_types,
            size: { less_than_or_equal_to: MAX_UPLOAD_SIZE }
end
