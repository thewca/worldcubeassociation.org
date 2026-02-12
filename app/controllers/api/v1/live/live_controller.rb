# frozen_string_literal: true

class Api::V1::Live::LiveController < Api::V1::ApiController
  protect_from_forgery with: :null_session

  skip_before_action :require_user, only: %i[round_results by_person podiums]

  def add_or_update_result
    results = params.expect(attempts: [%i[value attempt_number]])
    round_id = params.require(:round_id)
    competition_id = params.require(:competition_id)
    registration_id = params.require(:registration_id)

    round = Round.find_by_wcif_id!(round_id, competition_id, includes: [:live_results])

    # TODO: add require_managed! from round admin PR
    require_user

    # We create empty results when a round is open
    live_result = round.live_results.find_by(registration_id: registration_id)

    if live_result.blank?
      return render json: { status: "round is not open" }, status: :unprocessable_content unless round.live_results.any?

      return render json: { status: "user is not part of this round" }, status: :unprocessable_content
    end

    UpdateLiveResultJob.perform_later(live_result, results, @current_user.id)

    render json: { status: "ok" }
  end

  def round_results
    competition_id = params.require(:competition_id)
    wcif_id = params.require(:round_id)

    round = Round.find_by_wcif_id!(wcif_id, competition_id, includes: [:linked_round, live_results: %i[live_attempts event]])

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

    render json: final_rounds.map { |r| r.to_live_json(only_podiums: true) }
  end

  def open_round
    competition = Competition.find(params.require(:competition_id))
    wcif_id = params.require(:round_id)

    round = Round.find_by_wcif_id!(wcif_id, competition.id, includes: [:live_results])

    # TODO: Move these to actual error codes at one point
    return render json: { status: "unauthorized" }, status: :unauthorized unless @current_user.can_manage_competition?(competition)
    # Also think about if we should auto open all round ones at competition day start and not have this check
    return render json: { status: "previous round has empty results" }, status: :bad_request unless round.number == 1 || round.previous_round.score_taking_done?

    return render json: { status: "round already open" }, status: :bad_request if round.live_results.any?

    created_rows, locked_rows = round.open_and_lock_previous(@current_user)

    render json: { status: "ok", locked_rows: locked_rows, created_rows: created_rows }
  end

  def quit_competitor
    competition = Competition.find(params.require(:competition_id))
    registration_id = params.require(:registration_id)

    return render json: { status: "unauthorized" }, status: :unauthorized unless @current_user.can_manage_competition?(competition)

    round = Round.find_by_wcif_id!(wcif_id, competition.id, includes: [:live_results])
    result = round.live_results.find_by!(registration_id: registration_id)

    return render json: { status: "Cannot quit competitor with results" }, status: :bad_request if result.live_attempts.any?

    quit_count = round.quit_from_round!(registration_id, @current_user)

    render json: { status: "ok", quit: quit_count }
  end
end
