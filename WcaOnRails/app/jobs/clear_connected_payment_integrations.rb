# frozen_string_literal: true

class ClearConnectedPaymentIntegrations < WcaCronjob
  DELAY_IN_DAYS = 21

  def perform
    Competition.where("end_date < ?", DELAY_IN_DAYS.days.ago).each do |comp|
      CompetitionPaymentIntegration.disconnect(comp, :paypal) if CompetitionPaymentIntegration.paypal_connected?(comp)
      CompetitionPaymentIntegration.disconnect(comp, :stripe) if CompetitionPaymentIntegration.stripe_connected?(comp)
    end
  end
end
