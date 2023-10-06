# frozen_string_literal: true

class RemoveProbationFromTeams < ActiveRecord::Migration[7.0]
  def change
    Team.c_find_by_friendly_id!('probation').destroy
  end
end
