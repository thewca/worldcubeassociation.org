# frozen_string_literal: true

class AttendeePaymentRequest < ApplicationRecord
  has_one :stripe_payment_intent, as: :holder
  def competition_and_user_id
    self.attendee_id.split("-")
  end

  def competition
    competition_id, = competition_and_user_id
    Competition.find(competition_id)
  end

  def user
    _, user_id = competition_and_user_id
    User.find(user_id)
  end
end
