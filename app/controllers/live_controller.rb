# frozen_string_literal: true

class LiveController < ApplicationController
  def admin
    @competition_id = params[:competition_id]
    @competition = Competition.find(@competition_id)
    @round = Round.find(params[:round_id])
    @event_id = @round.event.id
    @competitors = @round.accepted_registrations_with_wcif_id
  end

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

    # TODO: What is the best way to do this?
    r = Result.new(value1: results[0], value2: results[1], value3: results[2], value4: results[3] || 0, value5: results[4] || 0, event_id: round.event.id, round_type_id: round.round_type_id, format_id: round.format_id)

    result.update(average: r.compute_correct_average, best: r.compute_correct_best, live_attempts: new_attempts, last_attempt_entered_at: Time.now.utc)

    render json: { status: "ok" }
  end

  def round_results
    @competition_id = params[:competition_id]
    @competition = Competition.find(@competition_id)
    @round = Round.find(params[:round_id])
    @event_id = @round.event.id
    @competitors = @round.registrations
  end

  def round_results_api
    round_id = params.require(:round_id)

    # TODO: Figure out why this fires a query for every live_attempt
    # LiveAttempt Load (0.6ms)  SELECT `live_attempts`.* FROM `live_attempts` WHERE `live_attempts`.`live_result_id` = 39 AND `live_attempts`.`replaced_by_id` IS NULL ORDER BY `live_attempts`.`attempt_number` ASC
    render json: Round.includes(live_results: [:live_attempts, :round, :event]).find(round_id).live_results
  end

  def double_check
    @round = Round.find(params.require(:round_id))
    @competition = Competition.find(params.require(:competition_id))

    @competitors = @round.accepted_registrations_with_wcif_id
  end

  def schedule_admin
    @competition_id = params.require(:competition_id)
    @competition = Competition.find(@competition_id)

    @rounds = Round.joins(:competition_event).where(competition_event: { competition_id: @competition_id })
  end

  def podiums
    @competition = Competition.find(params[:competition_id])
    @competitors = @competition.registrations.includes(:user).accepted
    @final_rounds = @competition.rounds.select(&:final_round?)
  end

  def competitors
    @competition = Competition.find(params[:competition_id])
    @competitors = @competition.registrations.includes(:user).accepted
  end

  def by_person
    registration_id = params.require(:registration_id)
    registration = Registration.find(registration_id)

    @competition_id = params[:competition_id]
    @competition = Competition.find(@competition_id)

    @user = registration.user
    @results = registration.live_results.includes(:live_attempts)
  end
end
