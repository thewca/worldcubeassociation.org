# frozen_string_literal: true

class RenameStripeTransactionToStripeRecord < ActiveRecord::Migration[7.1]
  def change
    rename_table :stripe_transactions, :stripe_records
    rename_column :stripe_webhook_events, :stripe_transaction_id, :stripe_record_id
    rename_column :stripe_payment_intents, :stripe_transaction_id, :stripe_record_id

    reversible do |direction|
      direction.up do
        execute <<-SQL
          UPDATE registration_payments
          SET receipt_type = 'StripeRecord'
          WHERE receipt_type = 'StripeTransaction'
        SQL
      end

      direction.down do
        execute <<-SQL
          UPDATE registration_payments
          SET receipt_type = 'StripeTransaction'
          WHERE receipt_type = 'StripeRecord'
        SQL
      end
    end
  end
end
