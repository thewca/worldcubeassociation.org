# frozen_string_literal: true

class DropCubingPhpbbDatabase < ActiveRecord::Migration[5.0]
  def up
    execute "RENAME TABLE cubing_phpbb.phpbb3_forums TO archive_phpbb3_forums"
    execute "RENAME TABLE cubing_phpbb.phpbb3_posts TO archive_phpbb3_posts"
    execute "RENAME TABLE cubing_phpbb.phpbb3_topics TO archive_phpbb3_topics"
    execute "RENAME TABLE cubing_phpbb.phpbb3_users TO archive_phpbb3_users"
    execute "DROP DATABASE cubing_phpbb"
  end
end
