# frozen_string_literal: true

class CreateWeat < ActiveRecord::Migration[5.2]
  def change
    Team.create(friendly_id: 'weat', email: "assistants@worldcubeassociation.org")
  end
end
