# frozen_string_literal: true

class ClearConnectedStripeAccount < WcaCronjob
  DELAY_IN_DAYS = 21

  # Not sure what the purpose of this job is - 2 options:
  # 1. To disconnect payments from the competition to prevent accidental payments (most likely)
  # 2. To protect the information of the stripe user account id (least likely - seem important that this information is retained)

  # Implementing (1)
  # Again, two options - I favour option 2:
  # 1. Disconnect the payment integration (leaving an orphaned connected_account record that's hard to tie back to the competition)
  # 2. Set the payment integration as inactive using a bool field on the model
  def perform
    Competition.where("end_date < ?", DELAY_IN_DAYS.days.ago).each do |comp|
      comp.competition_payment_integrations.each do |integration|
        integration.set_as_inactive
      end
    end
  end

  # def perform
  #   Competition.where("end_date < ?", DELAY_IN_DAYS.days.ago).update_all(connected_stripe_account_id: nil)
  # end
end
