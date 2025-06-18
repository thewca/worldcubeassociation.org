module TwitchInterface

  def self.wca_is_live?
    url = 'streams?user_login=worldcubeassociation'
    response = twitch_connection.get(url)
    response.body
  end

  def self.twitch_connection
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

  def self.generate_access_token
    options = {
      site: 'https://id.twitch.tv',
      token_url: '/oauth2/token',
      auth_scheme: :request_body,
    }

    client = OAuth2::Client.new(AppSecrets.TWITCH_CLIENT_ID, AppSecrets.TWITCH_CLIENT_SECRET, options)
    client.client_credentials.get_token.token
  end
end
