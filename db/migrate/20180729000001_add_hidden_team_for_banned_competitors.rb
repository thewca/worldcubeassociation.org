# frozen_string_literal: true

class AddHiddenTeamForBannedCompetitors < ActiveRecord::Migration[5.1]
  def change
    Team.create(friendly_id: 'banned', rank: 90, email: "disciplinary@worldcubeassociation.org", hidden: true)
  end
end
