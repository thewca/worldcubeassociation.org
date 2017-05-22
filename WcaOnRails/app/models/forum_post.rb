# frozen_string_literal: true

# NOTE: This is meant for displaying old content of the phpBB forum. It is DEPRECATED!

class ForumPost < ApplicationRecord
  self.table_name = "phpbb3_posts"
  self.primary_key = "post_id"
  establish_connection ActiveRecord::Base.connection_config.merge(database: "cubing_phpbb")

  belongs_to :poster, class_name: "ForumUser", foreign_key: :poster_id
end
