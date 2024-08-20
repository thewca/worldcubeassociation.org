# frozen_string_literal: true

module FaradayConfig
  def self.setup_connection(builder)
    # Sets headers and parses jsons automatically
    builder.request :json
    builder.response :json

    # Raises an error on 4xx and 5xx responses.
    builder.response :raise_error

    # Logs requests and responses.
    # By default, it only logs the request method and URL, and the request/response headers.
    builder.response :logger, ::Logger.new($stdout), bodies: true if Rails.env.development?
  end

  # This makes it so that we can just pass &FaradayConfig
  # as an arg directly to the last parameter of the Faraday constructor
  def self.to_proc
    self.method(:setup_connection).to_proc
  end
end
