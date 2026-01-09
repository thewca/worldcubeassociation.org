# frozen_string_literal: true

class CreateTicketsClaimWcaId < ActiveRecord::Migration[8.1]
  def change
    create_table :tickets_claim_wca_id do |t|
      t.string :status, null: false
      t.references :user, type: :integer, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end
