# frozen_string_literal: true

class Api::V1::Live::LiveController < Api::V1::ApiController
  protect_from_forgery with: :null_session
  skip_before_action :require_user, only: %i[round_results by_person]
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

  def add_result
    user = require_user
    competition_id = params.require(:competition_id)
    render_error(:unauthorized, LiveResults::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless user.can_manage_competition?(Competition.find(competition_id))

    results = params.permit(attempts: %i[result attempt_number])[:attempts]
    round_id = params.require(:round_id)
    registration_id = params.require(:registration_id)

    render_error(:unprocessable_content, LiveResults::ErrorCodes::LIVE_RESULT_ALREADY_EXISTS) if LiveResult.exists?(round_id: round_id, registration_id: registration_id)

    AddLiveResultJob.perform_later(results, round_id, registration_id, user)

    render json: { status: "ok" }
  end

  def update_result
    user = require_user
    results = params.require(:attempts)
    round = Round.find(params.require(:round_id))
    render_error(:unauthorized, LiveResults::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless user.can_manage_competition?(round.competition)

    registration_id = params.require(:registration_id)

    result = LiveResult.includes(:live_attempts).find_by(round: round, registration_id: registration_id)

    render_error(:unprocessable_content, LiveResults::ErrorCodes::LIVE_RESULT_NOT_FOUND) if result.blank?

    previous_attempts = result.live_attempts.index_by(&:attempt_number)

    new_attempts = results.map.with_index(1) do |r, i|
      previous_attempt = previous_attempts[i]

      if previous_attempt.present?
        if previous_attempt.result == r
          previous_attempt
        else
          previous_attempt.update_with_history_entry(r, user)
        end
      else
        LiveAttempt.build_with_history_entry(r, i, user)
      end
    end

    r = Result.new(
      value1: results[0],
      value2: results[1],
      value3: results[2],
      value4: results[3] || 0,
      value5: results[4] || 0,
      event_id: round.event.id,
      round_type_id: round.round_type_id,
      round_id: round.id,
      format_id: round.format_id,
    )

    result.update(average: r.compute_correct_average, best: r.compute_correct_best, live_attempts: new_attempts, last_attempt_entered_at: Time.now.utc)

    render json: { status: "ok" }
  end
end
