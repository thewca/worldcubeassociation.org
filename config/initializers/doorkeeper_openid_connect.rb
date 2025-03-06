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
    claim :email, response: [:id_token, :user_info] do |resource_owner|
      resource_owner.email
    end

    claim :name, response: [:id_token, :user_info] do |resource_owner|
      resource_owner.name
    end
  end

  # DO NOT MERGE IN THIS STATE!
  # Future WST members: If you ever find this in our code in its current state, punch Gregor.
  discovery_url_options do
    {
      # Override the host only for the `authorization` endpoint, because
      #   it's the only one that users need to manually access through a browser.
      # All other endpoints follow ROOT_URL, and you (the developer) are responsible
      #   for providing correct values there. In case of local development, we use Docker
      #   which has independent but network-linked containers, so the ROOT_URL will probably
      #   be something like `wca_on_rails:3000` (which is the way other containers talk to Rails).
      #   However, that URL won't work when opening it in the browser, which is why we do this override.
      # Note that the doorkeeper-openid_connect gem exposes this setting (probably) for exactly this
      #   use-case. It's even a listed sample snippet in their documentation: Just ABOVE
      #   https://github.com/doorkeeper-gem/doorkeeper-openid_connect?tab=readme-ov-file#scopes
      authorization: { host: 'http://localhost:3000' }
    }
  end
end
