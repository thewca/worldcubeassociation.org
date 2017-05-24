# frozen_string_literal: true

class AddShowOnHomepageToPosts < ActiveRecord::Migration[5.0]
  def change
    add_column :posts, :show_on_homepage, :boolean, null: false, default: true
    add_index :posts, [:show_on_homepage, :world_readable, :sticky, :created_at], name: "idx_show_wr_sticky_created_at"

    reversible do |dir|
      dir.up do
        execute "UPDATE posts SET show_on_homepage=FALSE WHERE id='delegate-crash-course'"
      end
      dir.down do
      end
    end
  end
end
