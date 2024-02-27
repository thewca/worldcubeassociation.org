# frozen_string_literal: true

# NOTE: This is meant for displaying old content of the phpBB forum. It is DEPRECATED!

class Forum < ApplicationRecord
  self.table_name = "archive_phpbb3_forums"
  self.primary_key = "forum_id"

  has_many :forum_topics

  # Don't bother with private forums.
  default_scope { where(forum_name: ["WCA Organisation", "WCA Regulations", "WCA Competitions", "WCA Records and Rankings", "WCA Website"]) }
end
