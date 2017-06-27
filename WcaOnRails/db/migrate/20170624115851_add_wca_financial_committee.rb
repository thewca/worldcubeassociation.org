# frozen_string_literal: true

class AddWcaFinancialCommittee < ActiveRecord::Migration[5.0]
  def change
    execute <<-SQL
      INSERT INTO teams (friendly_id, email, rank, created_at, updated_at) values ('wfc', 'finance@worldcubeassociation.org', 5, NOW(), NOW());
    SQL

    execute <<-SQL
      UPDATE teams set rank = 3 where friendly_id = 'wdc';
    SQL

    execute <<-SQL
      UPDATE teams set rank = 7 where friendly_id = 'wrc';
    SQL

    execute <<-SQL
      UPDATE teams set rank = 9 where friendly_id = 'wrt';
    SQL

    execute <<-SQL
      UPDATE teams set rank = 11 where friendly_id = 'wst';
    SQL
  end
end
