# frozen_string_literal: true

class Api::Internal::V1::UsersController < Api::Internal::V1::ApiController
  # We are using our own authentication method with vault
  protect_from_forgery except: [:competitor_info]
  def competitor_info
    competitors = params.require(:ids)
    users = User.find_all(competitors)
    render json: users.to_json({
                                 only: %w[id wca_id name gender country_iso2 email dob],
                               })
  end
end
