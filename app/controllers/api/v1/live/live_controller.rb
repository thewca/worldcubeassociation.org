# frozen_string_literal: true

class Api::V1::Live::LiveController < Api::V1::ApiController
  skip_before_action :require_user, only: %i[round_results by_person podiums]
  def round_results
    round_id = params.require(:round_id)

    round = Round.includes(live_results: %i[live_attempts round event]).find(round_id)

    render json: round.to_live_json
  end

  def by_person
    registration_id = params.require(:registration_id)
    registration = Registration.find(registration_id)
    competition = Competition.find(params.require(:competition_id))

    results = registration.live_results.includes(:live_attempts)

    user_wcif = registration.user.to_wcif(competition, registration)
    user_wcif["results"] = results

    render json: user_wcif
  end

  def podiums
    competition = Competition.find(params.require(:competition_id))
    final_rounds = competition.rounds.includes(live_results: %i[live_attempts round event]).select(&:final_round?)

    render json: final_rounds.map { |r| r.to_live_json(only_podiums: true)}
  end
end
