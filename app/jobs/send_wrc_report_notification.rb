# frozen_string_literal: true

class SendWrcReportNotification < WcaCronjob
  include Sidekiq::Worker

  def perform(competition)
    delegate_report = competition.delegate_report

    response = Faraday.post(EnvConfig.WRC_WEBHOOK_URL) do |req|
      req.headers['Content-Type'] = 'application/json'
      req.headers['Authorization'] = "Basic " + Base64.strict_encode64(
        "#{EnvConfig.WRC_WEBHOOK_USERNAME}:#{EnvConfig.WRC_WEBHOOK_PASSWORD}",
      )
      req.body = delegate_report.feedback_requests.to_json
    end

    Sidekiq::Logging.logger.info("WRC notification submitted for #{competition.id}. Response: #{response.inspect}")
  end
end
