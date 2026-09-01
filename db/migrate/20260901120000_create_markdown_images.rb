# frozen_string_literal: true

class CreateMarkdownImages < ActiveRecord::Migration[8.1]
  def change
    create_table :markdown_images do |t|
      # Nullable: images backfilled from historical markdown have no known uploader.
      t.references :uploaded_by, foreign_key: { to_table: :users }

      # Which bucket the file lives in, and therefore which URL was written into
      # the markdown. Chosen at upload time by the form doing the uploading,
      # because the record that will own the image often does not exist yet.
      t.string :visibility, null: false, default: 'private'

      t.timestamps
    end

    # One image can be used by several records: cloning a competition copies its
    # tabs verbatim, image URLs included, so the same file is legitimately
    # embedded in many tabs at once.
    create_table :markdown_image_usages do |t|
      t.references :markdown_image, null: false, foreign_key: true
      t.references :attachable, polymorphic: true, null: false, type: :string

      t.timestamps

      t.index %i[markdown_image_id attachable_type attachable_id], unique: true, name: "index_markdown_image_usages_uniqueness"
    end
  end
end
