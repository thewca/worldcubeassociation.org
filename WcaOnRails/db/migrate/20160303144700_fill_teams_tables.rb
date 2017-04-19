# frozen_string_literal: true

class FillTeamsTables < ActiveRecord::Migration
  def change
    execute <<-SQL
      INSERT INTO teams (friendly_id, name, description, created_at, updated_at) values ('results','Results Team','This team is responsible for managing all competition results.', NOW(), NOW())
    SQL

    execute <<-SQL
      INSERT INTO teams (friendly_id, name, description, created_at, updated_at) values ('software','Software Team','This team is responsible for managing the WCA\\'s software (website, scramblers, workbooks, admin tools).', NOW(), NOW())
    SQL

    execute <<-SQL
      INSERT INTO teams (friendly_id, name, description, created_at, updated_at) values ('wdc','Disciplinary Committee','This committee advises the WCA Board in special cases, like alleged violations of WCA Regulations, and may be contacted by WCA members in case of important personal matters regarding WCA competitions.', NOW(), NOW())
    SQL

    execute <<-SQL
      INSERT INTO teams (friendly_id, name, description, created_at, updated_at) values ('wrc','Regulations Committee','This committee is responsible for managing the WCA Regulations.', NOW(), NOW())
    SQL

    execute <<-SQL
      INSERT INTO team_members (team_id, user_id, start_date, created_at, updated_at) SELECT teams.id, users.id, NOW(), NOW(), NOW() FROM teams,users WHERE teams.friendly_id = 'results' and users.results_team = 1
    SQL

    execute <<-SQL
      INSERT INTO team_members (team_id, user_id, start_date, created_at, updated_at) SELECT teams.id, users.id, NOW(), NOW(), NOW() FROM teams,users WHERE teams.friendly_id = 'software' and users.software_team = 1
    SQL

    execute <<-SQL
      INSERT INTO team_members (team_id, user_id, start_date, created_at, updated_at) SELECT teams.id, users.id, NOW(), NOW(), NOW() FROM teams,users WHERE teams.friendly_id = 'wdc' and users.wdc_team = 1
    SQL

    execute <<-SQL
      INSERT INTO team_members (team_id, user_id, start_date, created_at, updated_at) SELECT teams.id, users.id, NOW(), NOW(), NOW() FROM teams,users WHERE teams.friendly_id = 'wrc' and users.wrc_team = 1
    SQL

    # This will work because each team leader is a member of just one team.
    # We would have to split this query otherwise.
    execute <<-SQL
      UPDATE team_members SET team_leader = 1 where user_id in (SELECT id from users where (wrc_team_leader = 1 OR wdc_team_leader = 1 OR results_team_leader = 1 or software_team_leader = 1))
    SQL
  end
end
