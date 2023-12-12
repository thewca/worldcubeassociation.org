# frozen_string_literal: true

module Microservices
  module Registrations
    def self.internal_get_registrations_path
      "/api/internal/v1/registrations"
    end

    def self.external_get_registrations_path(competition_id)
      "/api/v1/registrations/#{competition_id}"
    end

    def self.registration_connection
      Faraday.new(
        url: EnvConfig.WCA_REGISTRATIONS_URL,
        headers: { Microservices::Auth::MICROSERVICE_AUTH_HEADER => Microservices::Auth.get_wca_token },
      ) do |builder|
        # Sets headers and parses jsons automatically
        builder.request :json
        builder.response :json
        # Raises an error on 4xx and 5xx responses.
        builder.response :raise_error
        # Logs requests and responses.
        # By default, it only logs the request method and URL, and the request/response headers.
        builder.response :logger
      end
    end

    def self.get_all_registrations(competition_id)
      response = self.registration_connection.post(self.internal_get_registrations_path) do |req|
        req.body = { competition_id: competition_id }
      end
      response.body
    end

    def self.get_registrations_by_status(competition_id, status)
      response = self.registration_connection.post(self.internal_get_registrations_path) do |req|
        req.body = { competition_id: competition_id, status: status }
      end
      response.body
    end
  end
end
