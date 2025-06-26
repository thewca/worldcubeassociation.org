# frozen_string_literal: true

class AddShouldClaimWcaIdToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :should_claim_wca_id, :boolean, default: false, null: false
  end
end
