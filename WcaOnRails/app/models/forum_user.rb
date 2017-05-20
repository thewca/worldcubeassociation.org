# frozen_string_literal: true

# NOTE: This is meant for displaying old content of the phpBB forum. It is DEPRECATED!

class ForumUser < ApplicationRecord
  self.table_name = "phpbb3_users"
  self.primary_key = "user_id"
  establish_connection ActiveRecord::Base.connection_config.merge(database: "cubing_phpbb")
end
