# frozen_string_literal: true

class Api::V1::Live::LiveController < Api::V1::ApiController
  def add_result
    results = params.require(:attempts)
    round_id = params.require(:round_id)
    registration_id = params.require(:registration_id)

    return render json: { status: "result already exist" }, status: :unprocessable_entity if LiveResult.exists?(round_id: round_id, registration_id: registration_id)

    AddLiveResultJob.perform_later(results, round_id, registration_id, current_user)

    render json: { status: "ok" }
  end

  def update_result
    results = params.require(:attempts)
    round = Round.find(params.require(:round_id))
    registration_id = params.require(:registration_id)

    result = LiveResult.includes(:live_attempts).find_by(round: round, registration_id: registration_id)

    return render json: { status: "result does not exist" }, status: :unprocessable_entity if result.blank?

    previous_attempts = result.live_attempts.index_by(&:attempt_number)

    new_attempts = results.map.with_index(1) do |r, i|
      previous_attempt = previous_attempts[i]

      if previous_attempt.present?
        if previous_attempt.result == r
          previous_attempt
        else
          previous_attempt.update_with_history_entry(r, current_user)
        end
      else
        LiveAttempt.build_with_history_entry(r, i, current_user)
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

  def rounds
    competition = Competition.find(params.require(:competition_id))
    rounds = competition.rounds.includes(live_results: %i[live_attempts round event])

    render json: rounds.map { |r| r.to_live_json }
  end

  def round_results
    round_id = params.require(:round_id)

    round = Round.includes(live_results: %i[live_attempts round event]).find(round_id)

    render json: round.to_live_json
    @competitors = @round.accepted_registrations_with_wcif_id
  end

  def schedule_admin
    @competition_id = params.require(:competition_id)
    @competition = Competition.find(@competition_id)

    @rounds = Round.joins(:competition_event).where(competition_event: { competition_id: @competition_id })
  end

  def podiums
    competition = Competition.find(params.require(:competition_id))
    final_rounds = competition.rounds.includes(live_results: %i[live_attempts round event]).select(&:final_round?)

    render json: final_rounds.map { |r| r.to_live_json(only_podiums: true)}
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
end
