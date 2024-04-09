# frozen_string_literal: true

class DropAttendeePaymentRequest < ActiveRecord::Migration[7.1]
  def change
    drop_table :attendee_payment_requests
  end
end
