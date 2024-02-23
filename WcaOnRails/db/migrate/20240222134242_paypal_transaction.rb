class PaypalTransaction < ActiveRecord::Migration[7.1]
  def change
    create_table :paypal_transactions do |t|
      t.string :order_id
      t.string :status
      t.string :payload
      t.string :amount_in_cents
      t.string :currency_code

      t.timestamps
    end
  end
end
