# frozen_string_literal: true

module MicroServices
  module Registrations
    # Because these routes don't live in the monolith anymore we need some helper functions
    def competition_register_path(competition_id, stripe_status = nil)
      "https://#{EnvConfig.ROOT_URL}/competitions/#{competition_id}/register&stripe_status=#{stripe_status}"
    end

    def edit_registration_path(competition_id, user_id, stripe_error = nil)
      "https://#{EnvConfig.ROOT_URL}/competitions/#{competition_id}/#{user_id}/edit&stripe_error=#{stripe_error}"
    end

    def update_payment_status_path
      "https://#{EnvConfig.WCA_REGISTRATION_URL}/api/internal/v1/update_payment"
    end

    def update_registration_payment(attendee_id, payment_id, iso_amount, currency_iso, status)
      conn = Faraday.new(
        url: update_payment_status_path,
        headers: { MICROSERVICE_AUTH_HEADER => get_wca_token }
      ) do | builder |
        # Sets headers and parses jsons automatically
        builder.request :json
        builder.response :json
        # Raises an error on 4xx and 5xx responses.
        builder.response :raise_error
        # Logs requests and responses.
        # By default, it only logs the request method and URL, and the request/response headers.
        builder.response :logger
      end

      conn.post('/') do |req|
        req.body = { attendee_id: attendee_id, payment_id: payment_id, iso_amount: iso_amount, currency_iso: currency_iso, payment_status: status }
      end
      # If we ever need the response body
      conn.body
    end
  end
end
