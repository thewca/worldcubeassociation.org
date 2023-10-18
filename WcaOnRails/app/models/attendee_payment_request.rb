# frozen_string_literal: true

class AttendeePaymentRequest < ApplicationRecord
  has_one :stripe_payment_intents, as: :holder
  def competition_and_user_id
    self.attendee_id.split("-")
  end
end
