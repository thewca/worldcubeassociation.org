# frozen_string_literal: true

class AddIndexOnCompetitionIdAndPersonIdToInboxPerson < ActiveRecord::Migration[5.2]
  def change
    # This will prevent from adding any duplicate person for a given competition
    add_index :InboxPersons, [:competitionId, :id], unique: true
  end
end
