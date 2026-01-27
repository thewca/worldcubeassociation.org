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

    render json: final_rounds.map { |r| r.to_live_json(only_podiums: true) }
  end

  def open_round
    competition = Competition.find(params.require(:competition_id))

    activity_code =  ScheduleActivity.parse_activity_code(params.require(:round_id))

    event_id, number = activity_code.values_at(:event_id, :round_number)

    return render json: { status: "round not found" }, status: :not_found if event_id.nil? || number.nil?

    competition_event = competition.competition_events.find_by(event_id: event_id)

    round = competition.rounds.find_by!(competition_event_id: competition_event.id, number: number)

    # TODO: Move these to actual error codes at one point
    # Also think about if we should auto open all round ones at competition day start and not have this check
    return render json: { status: "previous round has empty results" }, status: :bad_request unless round.number == 1 || round.previous_round.score_taking_done?

    return render json: { status: "round already open" }, status: :bad_request if round.live_results.any?

    result = round.init_round

    render json: { success: result.affected_rows > 0 }
  end
end
