module TwitchInterface
  TWITCH_CHANNEL_LOGIN_NAME = 'lofigirl'
  # TWITCH_CHANNEL_ID = '233980668' # wca
  TWITCH_CHANNEL_ID = '65806828' # dev_spajus

  def self.our_youtube_live?
    url = "/youtube/v3/search?part=snippet&channelId=#{EnvConfig.YOUTUBE_CHANNEL_ID}&eventType=live&type=video"
    response = youtube_connection.get(url)
    puts response.body
  end

  def self.lofigirl_youtube_live?
    url = "/youtube/v3/search?part=snippet&channelId=UCSJ4gkVC6NrvII8umztf0Ow&eventType=live&type=video"
    response = youtube_connection.get(url)
    puts response.body
    response.body
  end

  def self.given_channel_live(channel_name)
    response = Faraday.get("https://www.youtube.com/c/@#{channel_name}/live")
    response.body.include?('watching now')
  end

  def self.get_display_video_id(channel_name)
    if given_channel_live(channel_name)
      puts "channel live"
    else
      puts "channel not live"
    end
  end

  def self.get_latest_vod
    url = "videos?user_id=#{TWITCH_CHANNEL_ID}&type=archive&first=1"
    response = twitch_connection.get(url)
    puts '======================================'
    puts response.body
    response.body['data'].first&.dig('id')
  end

  def self.get_user_id(login_name)
    url = "users?login=#{login_name}"
    response = twitch_connection.get(url)
    puts '======================================'
    puts response.body
    response.body['data'].first&.dig('id')
  end

  def self.wca_is_live?
    url = "streams?user_login=#{TWITCH_CHANNEL_LOGIN_NAME}"
    response = twitch_connection.get(url)
    response.body['data'].first&.dig('user_login') == TWITCH_CHANNEL_LOGIN_NAME # Stream data will not be returned if the channel is not live
  end

  private_class_method def self.youtube_connection
    Faraday.new(
      url: 'https://www.googleapis.com',
      params: { key: AppSecrets.YOUTUBE_API_KEY },
      headers: {
        'Content-Type' => 'application/json',
      },
      &FaradayConfig
    )
  end

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
