# frozen_string_literal: true

module ApiSignInHelper
  def api_sign_in_as(user, scopes: nil, application: nil)
    scopes ||= Doorkeeper::OAuth::Scopes.new
    token = double acceptable?: true, accessible?: true, resource_owner_id: user.id, scopes: scopes, application: application
    allow_any_instance_of(ApplicationController).to receive(:doorkeeper_token).and_return(token)
  end
end
