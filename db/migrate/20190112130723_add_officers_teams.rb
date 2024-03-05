# frozen_string_literal: true

class AddOfficersTeams < ActiveRecord::Migration[5.2]
  def change
    Team.create(friendly_id: 'chair')
    Team.create(friendly_id: 'executive_director')
    Team.create(friendly_id: 'secretary')
    Team.create(friendly_id: 'vice_chair')
  end
end
