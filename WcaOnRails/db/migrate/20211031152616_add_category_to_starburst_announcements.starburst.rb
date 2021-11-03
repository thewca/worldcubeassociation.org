# frozen_string_literal: true

# This migration comes from starburst (originally 20141112140703)

class AddCategoryToStarburstAnnouncements < ActiveRecord::Migration[4.2]
  def change
    add_column :starburst_announcements, :category, :text
  end
end
