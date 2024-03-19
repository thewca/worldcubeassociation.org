# frozen_string_literal: true

class RenameStripeTransactionToStripeRecord < ActiveRecord::Migration[7.1]
  def change
    rename_table :stripe_transactions, :stripe_records
    rename_column :stripe_webhook_events, :stripe_transaction_id, :stripe_record_id
    rename_column :stripe_payment_intents, :stripe_transaction_id, :stripe_record_id

    reversible do |direction|
      direction.up do
        RegistrationPayment.where(receipt_type: 'StripeTransaction').update_all(receipt_type: 'StripeRecord')
      end

      direction.down do
        RegistrationPayment.where(receipt_type: 'StripeRecord').update_all(receipt_type: 'StripeTransaction')
      end
    end
  end
end
