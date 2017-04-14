# frozen_string_literal: true

class AddWorldReadableToPosts < ActiveRecord::Migration
  def change
    add_column :posts, :world_readable, :boolean
    # For html homepage
    add_index :posts, [:world_readable, :sticky, :created_at]
    # For rss feed
    add_index :posts, [:world_readable, :created_at]
    Post.update_all(world_readable: true)
  end
end
