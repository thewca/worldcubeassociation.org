# frozen_string_literal: true

class AddAnnouncedAtToCompetitions < ActiveRecord::Migration
  def up
    add_column :Competitions, :announced_at, :datetime
    execute <<-SQL
      UPDATE Competitions
      SET announced_at = (SELECT created_at
        FROM posts
        WHERE posts.title LIKE CONCAT(Competitions.name,' on %')
        AND posts.created_at IS NOT NULL)
    SQL
  end

  def down
    remove_column :Competitions, :announced_at
  end
end
