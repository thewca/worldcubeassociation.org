# frozen_string_literal: true

class AddHiddenTeamForWsot < ActiveRecord::Migration[6.1]
  def change
    Team.create(friendly_id: 'wsot', email: "sports@worldcubeassociation.org", hidden: true)
  end
end
