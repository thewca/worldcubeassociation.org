# frozen_string_literal: true

class Api::V1::Live::LiveController < Api::V1::ApiController
  skip_before_action :require_user, only: %i[round_results by_person podiums]
  def round_results
    competition_id = params.require(:competition_id)
    wcif_id = params.require(:round_id)

    round = Round.find_by_wcif_id!(wcif_id, competition_id)

    render json: round.to_live_json
  end

  def admin
    competition = Competition.find(params.require(:competition_id))
    return render json: { status: "unauthorized" }, status: :unauthorized unless @current_user.can_manage_competition?(competition)

    render json: { rounds: competition.rounds.map(&:to_live_admin_json) }
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

    round = Round.find_by_wcif_id!(wcif_id, competition.id)

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

    round = Round.find_by_wcif_id!(wcif_id, competition.id)
    result = round.live_results.find_by!(registration_id: registration_id)

    return render json: { status: "Cannot quit competitor with results" }, status: :bad_request if result.live_attempts.any?

    quit_count = round.quit_from_round!(registration_id, @current_user)

    render json: { status: "ok", quit: quit_count }
  end
end
