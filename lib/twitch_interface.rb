module TwitchInterface
  # def self.get_latest_vod
  #   # url = 'videos?user_id=233980668&type=archive&first=1' # wca user_id
  #   url = 'videos?user_id=65806828&type=archive&first=1' # dev_spajus user_id
  #   # url = 'users?login=dev_spajus'
  #   response = twitch_connection.get(url)
  #   puts '======================================'
  #   puts response.body
  #   response.body['data'].first&.dig('id')
  # end

  # def self.wca_is_live?
  #   url = 'streams?user_login=worldcubeassociation'
  #   response = twitch_connection.get(url)
  #   response.body['data'].first&.dig('user_login') == 'worldcubeassociation' # Stream data will not be returned if the channel is not live
  # end

  private_class_method def self.twitch_connection
    Faraday.new(
      url: 'https://api.twitch.tv/helix/',
      headers: {
        'Authorization' => "Bearer #{generate_access_token}",
        'Client-Id' => AppSecrets.TWITCH_CLIENT_ID,
        'Content-Type' => 'application/json',
      },
      &FaradayConfig
    )
  end

  private_class_method def self.generate_access_token
    options = {
      site: 'https://id.twitch.tv',
      token_url: '/oauth2/token',
      auth_scheme: :request_body,
    }

    client = OAuth2::Client.new(AppSecrets.TWITCH_CLIENT_ID, AppSecrets.TWITCH_CLIENT_SECRET, options)
    client.client_credentials.get_token.token
  end
end
