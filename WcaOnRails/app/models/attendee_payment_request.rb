class AttendeePaymentRequest < ApplicationRecord
  belongs_to :receipt, polymorphic: true, optional: true
  def competition_and_user_id
    self.attendee_id.split("-")
  end
end
