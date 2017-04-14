# frozen_string_literal: true

class MakeStickyDefaultInPosts < ActiveRecord::Migration
  def change
    change_column_default(:posts, :sticky, false)
  end
end
