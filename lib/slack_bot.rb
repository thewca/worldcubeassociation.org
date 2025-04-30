# frozen_string_literal: true

module SlackBot
  ALARMS_CHANNEL_ID = 'C05KNNZNK1R'

  def self.client
    Slack::Web::Client.new(token: AppSecrets.SLACK_WST_BOT_TOKEN)
  end

  def self.send_error_report(message, exception)
    self.client.files_upload_v2(
      channel: ALARMS_CHANNEL_ID,
      filename: 'backtrace.txt',
      content: exception.backtrace.join("\n"),
      title: exception.message,
      initial_comment: message,
    )
  end

  def self.send_alarm_message(message)
    self.client.chat_postMessage(
      channel: ALARMS_CHANNEL_ID,
      text: message,
    )
  end
end
