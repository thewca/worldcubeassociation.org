# frozen_string_literal: true

class FixResultsPostedAt < ActiveRecord::Migration
  def change
    execute <<-SQL
      UPDATE Competitions
      SET results_posted_at = (SELECT created_at
        FROM posts
        WHERE posts.title LIKE CONCAT('%wins ', Competitions.name,'%')
        AND posts.created_at < '2016-04-19' AND posts.created_at > '2007-07-07')
    SQL
  end
end
