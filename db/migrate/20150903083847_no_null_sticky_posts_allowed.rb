# frozen_string_literal: true

class NoNullStickyPostsAllowed < ActiveRecord::Migration
  def change
    Post.where(sticky: nil).update_all(sticky: false)
    change_column :posts, :sticky, :boolean, null: false
  end
end
