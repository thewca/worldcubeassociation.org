# frozen_string_literal: true

class Api::V1::Live::LiveController < Api::V1::ApiController
  protect_from_forgery with: :null_session
  skip_before_action :require_user!, only: %i[round_results by_person podiums rounds]

  def add_or_update_result
    results = params.expect(attempts: [%i[value attempt_number]])
    round_id = params.require(:round_id)
    competition = Competition.find(params.require(:competition_id))
    registration_id = params.require(:registration_id)

    round = Round.find_by_wcif_id!(round_id, competition.id, includes: [:live_results])

    require_manage!(competition)

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

    round = Round.find_by_wcif_id!(wcif_id, competition_id, includes: [:linked_round, { live_results: %i[live_attempts event] }])

    render json: round.to_live_results_json
  end

  def rounds
    competition = Competition.includes(
      rounds: %i[live_results wcif_extensions],
    ).find(params.require(:competition_id))

    render json: { rounds: competition.rounds.map(&:to_live_info_json) }
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

    render json: final_rounds.map { |r| r.to_live_results_json(only_podiums: true) }
  end

  def clear_round
    competition = Competition.find(params.require(:competition_id))
    wcif_id = params.require(:round_id)

    round = Round.find_by_wcif_id!(wcif_id, competition.id)

    # TODO: Move these to actual error codes at one point
    require_manage!(competition)

    state = round.lifecycle_state

    return render json: { status: "round is locked" }, status: :bad_request if state == Round::STATE_LOCKED

    return render json: { status: "round is not open" }, status: :bad_request if [Round::STATE_READY, Round::STATE_PENDING].include?(state)

    recreated_rows = round.clear_round!(@current_user)

    render json: { status: "ok", recreated_rows: recreated_rows }
  end

  def clear_competitor
    competition = Competition.find(params.require(:competition_id))
    wcif_id = params.require(:round_id)
    registration_id = params.require(:registration_id)

    round = Round.find_by_wcif_id!(wcif_id, competition.id)

    require_manage!(competition)

    result = round.live_results.find_by!(registration_id: registration_id)

    delete_count = Live::DiffHelper.broadcast_changes(round) do
      deleted = result.live_attempts.delete_all
      LiveResult.reset_counters(result.id, :live_attempts)
      result.update!(average: 0, best: 0, advancing: false, advancing_questionable: false)
      deleted
    end

    result.live_result_history_entries.create(action_source: "live_results", action_type: "cleared", entered_by: @current_user)

    render json: { status: "ok", deleted_attempts: delete_count }
  end

  def open_round
    competition = Competition.find(params.require(:competition_id))
    wcif_id = params.require(:round_id)

    round = Round.find_by_wcif_id!(wcif_id, competition.id, includes: [:live_results])

    # TODO: Move these to actual error codes at one point
    require_manage!(competition)

    state = round.lifecycle_state

    return render json: { status: "score taking is not finished in the previous round" }, status: :bad_request if state == Round::STATE_PENDING

    return render json: { status: "round already open" }, status: :bad_request if [Round::STATE_OPEN, Round::STATE_LOCKED].include?(state)

    created_rows, locked_rows = round.open_and_lock_previous(@current_user)

    render json: { status: "ok", locked_rows: locked_rows, created_rows: created_rows }
  end

  def quit_competitor
    competition = Competition.find(params.require(:competition_id))
    wcif_id = params.require(:round_id)
    registration_id = params.require(:registration_id)
    advancing_ids = params[:advancing_ids]

    require_manage!(competition)

    round = Round.find_by_wcif_id!(wcif_id, competition.id, includes: [:live_results])
    result = round.live_results.find_by!(registration_id: registration_id)

    return render json: { status: "Can't advance next for first rounds" }, status: :bad_request if advancing_ids.present? && round.first_round?

    return render json: { status: "Cannot quit competitor with results" }, status: :bad_request if result.live_attempts.any?

    to_advance = round.next_participating_without(registration_id) if advancing_ids.present?

    return render json: { status: "The advancing competitor doesn't match who should be advancing.", should_advance: to_advance }, status: :bad_request if advancing_ids.present? && advancing_ids.map(&:to_i) != to_advance&.pluck(:registration_id)

    quit_count = round.quit_from_round!(registration_id, @current_user, to_advance: to_advance)

    render json: { status: "ok", quit: quit_count }
  end

  def next_if_quit
    competition = Competition.find(params.require(:competition_id))
    wcif_id = params.require(:round_id)
    registration_id = params.require(:registration_id)

    require_manage!(competition)

    round = Round.find_by_wcif_id!(wcif_id, competition.id, includes: [:live_results])

    to_advance = round.next_participating_without(registration_id)

    render json: { status: "ok", next_advancing: to_advance }
  end

  def add_competitor_to_round
    competition = Competition.find(params.require(:competition_id))
    registration = Registration.find(params.require(:registration_id))
    round = Round.find_by_wcif_id!(params.require(:round_id), competition.id)

    require_manage!(competition)

    Live::DiffHelper.broadcast_changes(round) do
      round.create_empty_live_result(registration.id)
    end

    render json: { status: "ok", competitor: registration.to_live_json }
  end
end
