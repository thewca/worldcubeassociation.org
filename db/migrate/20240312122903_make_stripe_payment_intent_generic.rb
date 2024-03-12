class MakeStripePaymentIntentGeneric < ActiveRecord::Migration[7.1]
  def change
    change_table :stripe_payment_intents do |t|
      t.rename :user_id, :initiated_by # Make the purpose of the user_id column more clear

      # Change the name of stripe_record_id to be used as the payment_record polymorphic association id column
      t.string :payment_record_type # Add a type column for the :payment_record association
      t.integer :payment_record_id
    end

    reversible do |direction|
      direction.up do
        StripePaymentIntent.update_all(payment_record_type: 'StripeRecord')

        StripePaymentIntent.find_each do |intent|
          intent.update!(payment_record_id: intent.stripe_record_id)
        end
      end

      direction.down do
        StripePaymentIntent.update_all(payment_record_type: nil, payment_record_id: nil)
      end
    end

    remove_column :stripe_payment_intents, :stripe_record_id

    rename_table :stripe_payment_intents, :payment_intents
  end
end
