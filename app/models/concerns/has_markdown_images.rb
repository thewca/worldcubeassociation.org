# frozen_string_literal: true

# Associates the images embedded in a model's markdown with that model. Include
# it and declare which columns to scan:
#
#   class Post < ApplicationRecord
#     include HasMarkdownImages
#     MARKDOWN_IMAGE_COLUMNS = %i[body].freeze
#   end
#
# Images are uploaded by UploadController while the user is still typing, so at
# upload time there is often no parent record yet (a new post, a new competition
# tab) and the client cannot be trusted to name one anyway - markdown gets
# copy-pasted between records. Instead each record works out which images it
# uses when it is saved, by scanning the declared columns for the URLs they
# contain.
module HasMarkdownImages
  extend ActiveSupport::Concern

  # Every model that embeds markdown images, for the tasks that have to scan all
  # of them. Declared here so those tasks do not depend on each other.
  def self.models
    Rails.application.eager_load!
    ApplicationRecord.descendants.select { it.include?(self) }
  end

  included do
    has_many :markdown_image_usages, as: :attachable, dependent: :destroy
    has_many :markdown_images, through: :markdown_image_usages

    after_save :sync_markdown_images
  end

  private def sync_markdown_images
    return if self.class::MARKDOWN_IMAGE_COLUMNS.none? { self.saved_change_to_attribute?(it) }

    # Rescan every column, not just the changed ones: an image can be dropped
    # from one column in the same save that another one changes.
    image_ids = self.class::MARKDOWN_IMAGE_COLUMNS.flat_map { MarkdownImage.image_ids_in(self.public_send(it)) }.uniq

    # An image the record no longer embeds loses its usage, but the file itself
    # survives: other records may well still be using it, because cloning a
    # competition copies its tabs' markdown verbatim.
    self.markdown_image_usages.where.not(markdown_image_id: image_ids).delete_all

    new_image_ids = image_ids - self.markdown_image_usages.pluck(:markdown_image_id)
    new_image_ids.each { self.markdown_image_usages.create!(markdown_image_id: it) }
  end
end
