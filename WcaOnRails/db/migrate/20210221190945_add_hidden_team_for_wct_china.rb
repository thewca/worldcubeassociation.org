# frozen_string_literal: true

class AddHiddenTeamForWctChina < ActiveRecord::Migration[5.2]
  def change
    Team.create(friendly_id: 'wct_china', email: "communication-china@worldcubeassociation.org", hidden: true)
  end
end
