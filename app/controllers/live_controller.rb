# frozen_string_literal: true

class LiveController < ApplicationController
  def admin
    @competition_id = params[:competition_id]
    @competition = Competition.find(@competition_id)
    @round = Round.find(params[:round_id])
    @event_id = @round.event.id
    @competitors = @round.accepted_registrations_with_wcif_id
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
    render json: Round.includes(live_results: %i[live_attempts round event]).find(round_id).live_results
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
