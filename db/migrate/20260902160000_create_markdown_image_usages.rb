# frozen_string_literal: true

class CreateMarkdownImageUsages < ActiveRecord::Migration[8.1]
  def change
    create_table :markdown_image_usages do |t|
      t.references :markdown_image, null: false, foreign_key: true
      t.references :attachable, polymorphic: true, null: false, type: :string

      t.timestamps

      t.index %i[markdown_image_id attachable_type attachable_id], unique: true, name: "index_markdown_image_usages_uniqueness"
    end
  end
end
