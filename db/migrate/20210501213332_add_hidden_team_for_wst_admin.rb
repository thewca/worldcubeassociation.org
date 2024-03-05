# frozen_string_literal: true

class AddHiddenTeamForWstAdmin < ActiveRecord::Migration[5.2]
  def change
    Team.create(friendly_id: 'wst_admin', email: "software-admin@worldcubeassociation.org", hidden: true)
  end
end
