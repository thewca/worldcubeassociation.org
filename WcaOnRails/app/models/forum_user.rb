# frozen_string_literal: true

# NOTE: This is meant for displaying old content of the phpBB forum. It is DEPRECATED!

class ForumUser < ApplicationRecord
  self.table_name = "archive_phpbb3_users"
  self.primary_key = "user_id"
end
