# frozen_string_literal: true

class AddFreeEntryStatusToCompetitions < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :free_entry_status, :integer, default: 0
  end
end
