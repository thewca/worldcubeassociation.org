class CreateAttendeePaymentRequests < ActiveRecord::Migration[7.0]
  def change
    create_table :attendee_payment_requests do |t|
      t.string :attendee_id
      t.bigint :receipt_id
      t.string :payment_id
      t.timestamps
    end
  end
end
