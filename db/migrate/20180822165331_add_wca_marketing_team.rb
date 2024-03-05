# frozen_string_literal: true

class AddWcaMarketingTeam < ActiveRecord::Migration[5.2]
  def change
    execute <<-SQL
      INSERT INTO teams (friendly_id, email, rank, created_at, updated_at) values ('wmt', 'marketing@worldcubeassociation.org', 50, NOW(), NOW());
    SQL
    execute <<-SQL
      UPDATE teams set rank = 60 where friendly_id = 'wqac';
    SQL
    execute <<-SQL
      UPDATE teams set rank = 70 where friendly_id = 'wrc';
    SQL
    execute <<-SQL
      UPDATE teams set rank = 80 where friendly_id = 'wrt';
    SQL
    execute <<-SQL
      UPDATE teams set rank = 90 where friendly_id = 'wst';
    SQL
    execute <<-SQL
      UPDATE teams set rank = 100 where friendly_id = 'banned';
    SQL
  end
end
