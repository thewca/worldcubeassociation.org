# frozen_string_literal: true

class AddBoardTeam < ActiveRecord::Migration[5.1]
  def up
    execute <<-SQL
      INSERT INTO teams (friendly_id, email, rank, created_at, updated_at) values ('board', 'board@worldcubeassociation.org', 1, NOW(), NOW());
    SQL

    execute <<-SQL
      INSERT INTO team_members (team_id, user_id, start_date, created_at, updated_at) (SELECT teams.id, users.id, NOW(), NOW(), NOW() FROM teams, users WHERE teams.friendly_id = 'board' and users.delegate_status = 'board_member');
    SQL

    execute <<-SQL
      UPDATE users set delegate_status = 'delegate' where delegate_status = 'board_member';
    SQL
  end

  def down
    execute <<-SQL
      DELETE FROM teams WHERE friendly_id = 'board';
    SQL
  end
end
