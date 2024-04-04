# frozen_string_literal: true

class MakeStripePaymentIntentGeneric < ActiveRecord::Migration[7.1]
  def change
    change_table :stripe_payment_intents do |t|
      t.rename :user_id, :initiated_by_id # Make the purpose of the user_id column more clear
      t.rename :confirmed_by_id, :confirmation_source_id
      t.rename :confirmed_by_type, :confirmation_source_type
      t.rename :canceled_by_id, :cancellation_source_id
      t.rename :canceled_by_type, :cancellation_source_type
      t.rename :stripe_record_id, :payment_record_id

      t.string :wca_status
      t.string :payment_record_type, after: :holder_id
    end

    rename_table :stripe_payment_intents, :payment_intents
    rename_index :payment_intents, 'index_stripe_payment_intents_on_holder', 'index_payment_intents_on_holder'
    remove_foreign_key :payment_intents, :stripe_records
    rename_column :stripe_records, :status, :stripe_status
    rename_column :stripe_records, :api_type, :stripe_record_type
    rename_column :paypal_records, :status, :paypal_status

    reversible do |direction|
      direction.up do
        PaymentIntent.update_all(payment_record_type: 'StripeRecord')

        PaymentIntent.find_each do |intent|
          intent.update(wca_status: intent.payment_record.determine_wca_status)
        end
      end
    end
  end
end
