# frozen_string_literal: true

class AddManualPaymentIntegrationTable < ActiveRecord::Migration[7.2]
  def change
    create_table :manual_payment_integrations do |t|
      t.string :payment_reference_label, null: false
      t.text :payment_instructions, null: false
      t.timestamps
    end
  end
end
