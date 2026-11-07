# frozen_string_literal: true

class RenameMarkdownImagesToAttachedImages < ActiveRecord::Migration[8.1]
  def change
    rename_table :markdown_images, :attached_images

    up_only do
      execute "UPDATE active_storage_attachments SET record_type = 'AttachedImage' WHERE record_type = 'MarkdownImage'"
    end

    create_table :attached_image_usages do |t|
      t.references :attached_image, null: false, foreign_key: true
      t.references :attachable, polymorphic: true, null: false, type: :string

      t.timestamps

      t.index %i[attached_image_id attachable_type attachable_id], unique: true, name: "index_attached_image_usages_uniqueness"
    end
  end
end
