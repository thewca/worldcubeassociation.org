# frozen_string_literal: true

class CreateCompetitionPaymentIntegrations < ActiveRecord::Migration[7.1]
  def change
    create_table :competition_payment_integrations do |t|
      t.references :connected_account, polymorphic: true, null: false
      t.references :competition, null: false, type: :string

      t.timestamps
    end
  end
end
