# frozen_string_literal: true

class AddUserIdToPreregs < ActiveRecord::Migration
  def change
    add_column :Preregs, :user_id, :int
    add_index :Preregs, [:competitionId, :user_id], unique: true
    change_column_default :Preregs, :status, "p"
  end
end
