# frozen_string_literal: true

class Api::V1::Live::LiveController < Api::V1::ApiController
  skip_before_action :require_user, only: %i[round_results]
  def round_results
    round_id = params.require(:round_id)

    round = Round.includes(live_results: %i[live_attempts round event]).find(round_id)

    render json: round.to_live_json
  end
end
