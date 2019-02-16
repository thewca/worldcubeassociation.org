# frozen_string_literal: true

class AddWac < ActiveRecord::Migration[5.2]
  def change
    Team.create(friendly_id: 'wac', email: "advisory@worldcubeassociation.org")
  end
end
