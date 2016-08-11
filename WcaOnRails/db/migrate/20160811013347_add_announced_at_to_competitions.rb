class AddAnnouncedAtToCompetitions < ActiveRecord::Migration
  def up
    add_column :Competitions, :announced_at, :datetime
    execute <<-SQL
      UPDATE Competitions
      SET announced_at = (SELECT created_at
        FROM posts
        WHERE posts.title LIKE CONCAT(Competitions.name,'%')
        AND posts.created_at IS NOT NULL and posts.created_at NOT LIKE '2007-07-03%')
    SQL
  end

  def down
    remove_column :Competitions, :announced_at
  end
end
