# frozen_string_literal: true

module Microservices
  module Registrations
    # Because these routes don't live in the monolith anymore we need some helper functions
    def self.competition_register_path(competition_id, stripe_status = nil)
      "#{EnvConfig.ROOT_URL}/competitions/v2/#{competition_id}/register?&stripe_status=#{stripe_status}"
    end

    def self.registration_import_path(competition_id)
      "#{EnvConfig.ROOT_URL}/competitions/v2/#{competition_id}/import"
    end

    def self.edit_registration_path(competition_id, user_id, stripe_error = nil)
      "#{EnvConfig.ROOT_URL}/competitions/v2/#{competition_id}/#{user_id}/edit?&stripe_error=#{stripe_error}"
    end

    def self.update_payment_status_path
      "/api/internal/v1/update_payment"
    end

    def self.registrations_by_user_path(id)
      "/api/internal/v1/users/#{id}/registrations"
    end

    def self.get_registrations_path(competition_id)
      "/api/internal/v1/#{competition_id}/registrations"
    end

    def self.get_registration_path(attendee_id)
      "/api/internal/v1/#{attendee_id}"
    end

    def self.get_competitor_count_path(competition_id)
      "/api/v1/#{competition_id}/count"
    end

    def self.registration_connection
      base_url = if Rails.env.development?
                   EnvConfig.WCA_REGISTRATIONS_BACKEND_URL
                 else
                   EnvConfig.WCA_REGISTRATIONS_URL
                 end
      Faraday.new(
        url: base_url,
        headers: { Microservices::Auth::MICROSERVICE_AUTH_HEADER => Microservices::Auth.get_wca_token },
        &FaradayConfig
      )
    end

    def self.registrations_by_user(user_id, cache: true)
      response = self.registration_connection.get(self.registrations_by_user_path(user_id))

      cache ? self.cache_and_return(response.body) : response.body
    end

    # rubocop:disable Metrics/ParameterLists
    def self.update_registration_payment(attendee_id, payment_id, iso_amount, currency_iso, status, actor)
      response = self.registration_connection.post(self.update_payment_status_path) do |req|
        req.body = { attendee_id: attendee_id, payment_id: payment_id, iso_amount: iso_amount, currency_iso: currency_iso, payment_status: status, acting_type: actor[:type], acting_id: actor[:id] }.to_json
      end

      # If we ever need the response body
      response.body
    end
    # rubocop:enable Metrics/ParameterLists

    def self.competitor_count_by_competition(competition_id)
      response = self.registration_connection.get(self.get_competitor_count_path(competition_id))

      response.body["count"]
    end

    def self.registrations_by_competition(competition_id, status = nil, event_id = nil, cache: true)
      response = self.registration_connection.get(self.get_registrations_path(competition_id)) do |req|
        if status.present?
          req.params[:status] = status
        end

        if event_id.present?
          req.params[:event_id] = event_id
        end
      end

      cache ? self.cache_and_return(response.body) : response.body
    end

    def self.cache_and_return(ms_registrations)
      ms_registrations.tap do |registrations|
        db_registrations = registrations.map { |reg| reg.slice('competition_id', 'user_id') }
        MicroserviceRegistration.upsert_all(db_registrations)
      end
    end

    def self.registration_by_id(attendee_id)
      response = self.registration_connection.get(self.get_registration_path(attendee_id))
      response.body
    end
  end
end
