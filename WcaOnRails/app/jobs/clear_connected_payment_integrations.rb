# frozen_string_literal: true

class ClearConnectedPaymentIntegrations < WcaCronjob
  DELAY_IN_DAYS = 21

  def perform
    Competition.where("end_date < ?", DELAY_IN_DAYS.days.ago).each do |comp|
      CompetitionPaymentIntegration.disconnect_all(comp)
    end
  end
end
