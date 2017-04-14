# frozen_string_literal: true

class DropInboxPersonsOldAndInboxResultsOldTables < ActiveRecord::Migration
  def change
    drop_table :InboxPersons_old
    drop_table :InboxResults_old
  end
end
