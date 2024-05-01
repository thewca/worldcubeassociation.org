# frozen_string_literal: true

class Api::V0::ResultsController < Api::V0::ApiController
  def personal_records
    user = User.find(params.require(:user_id))

    render json: user.personal_records.map(&:to_wcif)
  end
end
