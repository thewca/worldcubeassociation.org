# frozen_string_literal: true

class AddTeamForWat < ActiveRecord::Migration[6.1]
  def change
    Team.create(friendly_id: 'wat', email: "archive@worldcubeassociation.org", hidden: true)
  end
end
