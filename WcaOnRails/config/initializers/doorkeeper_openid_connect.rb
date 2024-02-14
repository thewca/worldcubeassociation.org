# frozen_string_literal: true

Doorkeeper::OpenidConnect.configure do
  issuer EnvConfig.ROOT_URL
  subject do |resource_owner|
    resource_owner.id
  end
  signing_key AppSecrets.OIDC_SECRET_KEY
  # This is an asymmetric encryption, meaning the clients validating the JWT Token use the Public key instead
  signing_algorithm :rs256

  resource_owner_from_access_token do |access_token|
    User.find(access_token.resource_owner_id)
  end

  auth_time_from_resource_owner do |resource_owner|
    resource_owner.current_sign_in_at
  end

  reauthenticate_resource_owner do
    # Not sure about if we even want to support this
    redirect_to new_user_session_url
  end

  # 5 Minutes expiration time (default is 2 minutes)
  expiration 300.seconds

  claims do
    claim :email do |resource_owner|
      resource_owner.email
    end

    claim :full_name do |resource_owner|
      "#{resource_owner.first_name} #{resource_owner.last_name}"
    end

    claim :teams, response: [:id_token, :user_info] do |resource_owner|
      resource_owner.teams
    end
  end
end
