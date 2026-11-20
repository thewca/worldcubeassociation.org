# frozen_string_literal: true

class RenameMarkdownImagesToAttachedImages < ActiveRecord::Migration[8.1]
  def change
    rename_table :markdown_images, :attached_images

    up_only do
      execute "UPDATE active_storage_attachments SET record_type = 'AttachedImage' WHERE record_type = 'MarkdownImage'"
    end

    add_reference :attached_images, :attachable, polymorphic: true, type: :string
  end
end
