# frozen_string_literal: true

class CreateMarkdownImages < ActiveRecord::Migration[8.1]
  def change
    create_table :markdown_images do |t|
      # Nullable: images backfilled from historical markdown have no known uploader.
      t.references :uploaded_by, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end
