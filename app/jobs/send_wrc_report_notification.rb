# frozen_string_literal: true

class SendWrcReportNotification < WcaCronjob
  def perform(competition)
    delegate_report = competition.delegate_report

    Faraday.post(EnvConfig.WRC_WEBHOOK_URL) do |req|
      req.headers['Content-Type'] = 'application/json'
      req.headers['Authorization'] = "Basic " + Base64.strict_encode64(
        "#{AppSecrets.WRC_WEBHOOK_USERNAME}:#{AppSecrets.WRC_WEBHOOK_PASSWORD}",
      )
      req.body = delegate_report.feedback_requests.to_json
    end
  end
end
