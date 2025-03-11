# frozen_string_literal: true

module LogTagging
  def self.user_log_tag(request)
    session_key = Rails.application.config.session_options[:key]
    session_data = request.cookie_jar.encrypted[session_key]

    return unless session_data.present?

    # Extract all keys starting with "warden.user." and capture the scope
    session_data.keys.filter_map do |key|
      key.match(/^warden\.user\.(.+)\.key$/) do |match|
        user_id = session_data.dig(key, 0, 0)
        "#{match[1]}:#{user_id}" if user_id
      end
    end.join(',')
  end
end
