# frozen_string_literal: true

class UpdateCommittesEmails < ActiveRecord::Migration[5.1]
  def change
    execute <<-SQL
      UPDATE teams set email = 'disciplinary@worldcubeassociation.org' where friendly_id = 'wdc';
    SQL

    execute <<-SQL
      UPDATE teams set email = 'regulations@worldcubeassociation.org' where friendly_id = 'wrc';
    SQL
  end
end
