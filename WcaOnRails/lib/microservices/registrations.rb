# frozen_string_literal: true

module Microservices
  module Registrations
    # Because these routes don't live in the monolith anymore we need some helper functions
    def self.competition_register_path(competition_id, stripe_status = nil)
      "#{EnvConfig.ROOT_URL}/competitions/v2/#{competition_id}/register&stripe_status=#{stripe_status}"
    end

    def self.edit_registration_path(competition_id, user_id, stripe_error = nil)
      "#{EnvConfig.ROOT_URL}/competitions/v2/#{competition_id}/#{user_id}/edit&stripe_error=#{stripe_error}"
    end

    def self.update_payment_status_path
      "/api/internal/v1/update_payment"
    end

    def self.update_registration_payment(attendee_id, payment_id, iso_amount, currency_iso, status)
      conn = Faraday.new(
        url: EnvConfig.WCA_REGISTRATION_URL,
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

      response = conn.post(self.update_payment_status_path) do |req|
        req.body = { attendee_id: attendee_id, payment_id: payment_id, iso_amount: iso_amount, currency_iso: currency_iso, payment_status: status }.to_json
      end
      # If we ever need the response body
      response.body
    end
  end
end
