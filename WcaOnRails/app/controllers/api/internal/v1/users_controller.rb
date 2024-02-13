# frozen_string_literal: true

class Api::Internal::V1::UsersController < Api::Internal::V1::ApiController
  # We are using our own authentication method with vault
  protect_from_forgery except: [:competitor_info]
  def competitor_info
    competitors = params.require(:ids)
    users = User.find(competitors)
    data = users.map { |u|
      u.serializable_hash({
                            only: %w[id wca_id name gender country_iso2 email dob],
                          },
                          overwrite_default: true)
    }
    render json: data
  end
end
