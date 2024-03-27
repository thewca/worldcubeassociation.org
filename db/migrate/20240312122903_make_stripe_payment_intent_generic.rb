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
    rename_column :stripe_records, :status, :stripe_status
    rename_column :paypal_records, :status, :paypal_status

    reversible do |direction|
      direction.up do
        PaymentIntent.update_all(payment_record_type: 'StripeRecord')

        PaymentIntent.find_each do |intent|
          intent.assign_attributes(payment_record_id: intent.payment_record_id)
          intent.assign_wca_status!
          intent.save
        end
      end

      direction.down do
        PaymentIntent.find_each do |intent|
          intent.update_attributes(payment_record_id: intent.payment_record_id)
        end
      end
    end
  end
end
