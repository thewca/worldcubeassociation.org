# frozen_string_literal: true

class MakeStripePaymentIntentGeneric < ActiveRecord::Migration[7.1]
  def change
    change_table :stripe_payment_intents do |t|
      t.rename :user_id, :initiated_by_id # Make the purpose of the user_id column more clear
      t.rename :confirmed_by_id, :confirmation_source_id
      t.rename :confirmed_by_type, :confirmation_source_type
      t.rename :canceled_by_id, :cancellation_source_id
      t.rename :canceled_by_type, :cancellation_source_type

      t.string :payment_record_type
      t.integer :payment_record_id
    end

    rename_table :stripe_payment_intents, :payment_intents

    reversible do |direction|
      direction.up do
        PaymentIntent.update_all(payment_record_type: 'StripeRecord')

        PaymentIntent.find_each do |intent|
          intent.update!(payment_record_id: intent.stripe_record_id)
        end
      end
    end

    remove_column :payment_intents, :stripe_record_id, :integer
  end
end
