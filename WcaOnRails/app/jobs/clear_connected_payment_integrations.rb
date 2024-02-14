# frozen_string_literal: true

class ClearConnectedPaymentIntegrations < WcaCronjob
  DELAY_IN_DAYS = 21

  def perform
    comps_to_disconnect = Competition.where("end_date < ?", DELAY_IN_DAYS.days.ago).joins(:competition_payment_integrations).distinct
    comps_to_disconnect.each do |comp|
      CompetitionPaymentIntegration.disconnect_all(comp)
    end
  end
end
