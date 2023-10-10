# frozen_string_literal: true

module MicroServicesRegistrations
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

  def update_registration_payment(id, status)
    token = get_wca_token
    response = Faraday.post(update_payment_status_path, headers: { MICROSERVICE_AUTH_HEADER => token, "Content-Type" => "application/json" }, body: { payment_id: id, payment_status: status }.to_json)
    unless response.ok?
      raise Error "Updating wca-registration failed with error #{response.status} #{response.body}"
    end
  end
end
