# frozen_string_literal: true

module ApiSignInControllerHelper
  def api_sign_in_as(user, scopes: nil)
    scopes ||= Doorkeeper::OAuth::Scopes.new
    token = double acceptable?: true, resource_owner_id: user.id, scopes: scopes
    allow(controller).to receive(:doorkeeper_token) { token }
  end
end
