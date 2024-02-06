# frozen_string_literal: true

module SlackBot
  ALARMS_CHANNEL_ID = 'C05KNNZNK1R'

  def self.client
    Slack::Web::Client.new(token: AppSecrets.SLACK_WST_BOT_TOKEN)
  end

  def self.send_error_report(message, exception)
    self.client.files_upload(
      channels: ALARMS_CHANNEL_ID,
      content: exception.backtrace.join("\n"),
      title: exception.message,
      initial_comment: message,
    )
  end
end
