# frozen_string_literal: true

class RemoveWorldReadableFromPosts < ActiveRecord::Migration[5.2]
  def change
    remove_column :posts, :world_readable, :boolean
  end
end
