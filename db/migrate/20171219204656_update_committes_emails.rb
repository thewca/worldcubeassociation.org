# frozen_string_literal: true

class UpdateCommittesEmails < ActiveRecord::Migration[5.1]
  def change
    execute <<-SQL.squish
      UPDATE teams set email = 'disciplinary@worldcubeassociation.org' where friendly_id = 'wdc';
    SQL

    execute <<-SQL.squish
      UPDATE teams set email = 'regulations@worldcubeassociation.org' where friendly_id = 'wrc';
    SQL
  end
end
