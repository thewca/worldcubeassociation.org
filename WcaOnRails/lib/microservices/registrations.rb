# frozen_string_literal: true

module Microservices
  module Registrations
    # TODO: Create draft PR
    # TODO: Update list endpoint to put registrations in a `registrations` key
    # TODO: Create new internal routes in wca-registration
    # TODO: Eliminate my unnecessary/redundant routes
    # Because these routes don't live in the monolith anymore we need some helper functions
    def self.competition_register_path(competition_id, stripe_status = nil)
      "#{EnvConfig.ROOT_URL}/competitions/v2/#{competition_id}/register?&stripe_status=#{stripe_status}"
    end

    def self.edit_registration_path(competition_id, user_id, stripe_error = nil)
      "#{EnvConfig.ROOT_URL}/competitions/v2/#{competition_id}/#{user_id}/edit?&stripe_error=#{stripe_error}"
    end

    def self.update_payment_status_path
      "/api/internal/v1/update_payment"
    end

    # def self.registrations_path(competition_id)
    #   "/api/v1/registrations/#{competition_id}"
    # end

    def self.internal_get_registrations_path
      "/api/internal/v1/registrations"
    end

    def self.external_get_registrations_path(competition_id)
      "/api/v1/registrations/#{competition_id}"
    end

    def self.registration_connection
      # TODO: Add endpoint mocking for vault so that we don't have to limit environments where this is used
      if Rails.env.production?
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
      else
        Faraday.new(
          url: EnvConfig.WCA_REGISTRATIONS_URL,
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
    end

    def self.update_registration_payment(attendee_id, payment_id, iso_amount, currency_iso, status)
      response = self.registration_connection.post(self.update_payment_status_path) do |req|
        req.body = { attendee_id: attendee_id, payment_id: payment_id, iso_amount: iso_amount, currency_iso: currency_iso, payment_status: status }.to_json
      end
      # If we ever need the response body
      response.body
    end

    # def self.get_registrations(competition_id)
    #   response = self.registration_connection.get(self.registrations_path(competition_id))
    #   body = JSON.parse(response.body)
    #   body['registrations']
    # end

    def self.get_all_registrations(competition_id)
      puts competition_id
      response = self.registration_connection.post(self.internal_get_registrations_path) do |req|
        req.body = { competition_id: competition_id }
      end
      body = JSON.parse(response.body)
      body['registrations']
    end

    def self.get_registrations_by_status(competition_id, status)
      response = self.registration_connection.post(self.internal_get_registrations_path) do |req|
        req.body = { competition_id: competition_id, status: status }
      end
      body = JSON.parse(response.body)
      body['registrations']
    end
  end
end
