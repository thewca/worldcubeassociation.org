# frozen_string_literal: true

class CreatePostTags < ActiveRecord::Migration[5.0]
  def change
    create_table :post_tags do |t|
      t.references :post, null: false
      t.string :tag, null: false
    end
    add_index :post_tags, :tag
    add_index :post_tags, [:post_id, :tag], unique: true
  end
end
