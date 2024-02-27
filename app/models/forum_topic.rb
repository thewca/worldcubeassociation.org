# frozen_string_literal: true

# NOTE: This is meant for displaying old content of the phpBB forum. It is DEPRECATED!

class ForumTopic < ApplicationRecord
  self.table_name = "archive_phpbb3_topics"
  self.primary_key = "topic_id"

  has_many :forum_posts, foreign_key: "topic_id"
end
