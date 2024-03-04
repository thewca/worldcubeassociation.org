# frozen_string_literal: true

class AddWcaDataProtectionCommittee < ActiveRecord::Migration[5.2]
  def change
    Team.create(friendly_id: 'wdpc', email: "dataprotection@worldcubeassociation.org")
  end
end
