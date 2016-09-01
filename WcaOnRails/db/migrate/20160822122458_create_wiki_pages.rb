# frozen_string_literal: true
class CreateWikiPages < ActiveRecord::Migration
  def change
    create_table :wiki_pages do |t|
      t.references :author
      t.string :title
      t.text :content

      t.timestamps null: false
    end
  end
end
