# frozen_string_literal: true

module FaradayHelper
  def self.default_connection(builder)
    # Sets headers and parses jsons automatically
    builder.request :json
    builder.response :json

    # Raises an error on 4xx and 5xx responses.
    builder.response :raise_error

    # Logs requests and responses.
    # By default, it only logs the request method and URL, and the request/response headers.
    builder.response :logger, ::Logger.new($stdout), bodies: true if Rails.env.development?
  end
end
