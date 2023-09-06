# frozen_string_literal: true

class ClearConnectedStripeAccount < WcaCronjob
  DELAY_IN_DAYS = 21

  def perform
    Competition.where("end_date < ?", DELAY_IN_DAYS.days.ago).update_all(connected_stripe_account_id: nil)
  end
end
