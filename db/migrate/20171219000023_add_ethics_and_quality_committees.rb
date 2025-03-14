# rubocop:disable all
# frozen_string_literal: true

class AddEthicsAndQualityCommittees < ActiveRecord::Migration[5.1]
  def change
    execute <<-SQL.squish
      INSERT INTO teams (friendly_id, email, rank, created_at, updated_at) values ('wec', 'ethics@worldcubeassociation.org', 30, NOW(), NOW());
    SQL

    execute <<-SQL.squish
      INSERT INTO teams (friendly_id, email, rank, created_at, updated_at) values ('wqac', 'quality@worldcubeassociation.org', 50, NOW(), NOW());
    SQL

    execute <<-SQL.squish
      UPDATE teams set rank = 10 where friendly_id = 'wct';
    SQL

    execute <<-SQL.squish
      UPDATE teams set rank = 20 where friendly_id = 'wdc';
    SQL

    execute <<-SQL.squish
      UPDATE teams set rank = 40 where friendly_id = 'wfc';
    SQL

    execute <<-SQL.squish
      UPDATE teams set rank = 60 where friendly_id = 'wrc';
    SQL

    execute <<-SQL.squish
      UPDATE teams set rank = 70 where friendly_id = 'wrt';
    SQL

    execute <<-SQL.squish
      UPDATE teams set rank = 80 where friendly_id = 'wst';
    SQL
  end
end
