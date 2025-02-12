# frozen_string_literal: true

class LiveController < ApplicationController
  def schedule_admin
    @competition_id = params.require(:competition_id)
    @competition = Competition.find(@competition_id)

    @rounds = Round.joins(:competition_event).where(competition_event: { competition_id: @competition_id })
  end

  def podiums
    @competition = Competition.find(params[:competition_id])
    @competitors = @competition.registrations.accepted
    @results = @competition.rounds.select(&:final_round?)
  end

  def competitors
    @competition = Competition.find(params[:competition_id])
    @competitors = @competition.registrations.accepted
  end

  def by_persons
    registration_id = params.require(:registration_id)
    registration = Registration.find(registration_id)

    @competition_id = params[:competition_id]
    @competition = Competition.find(@competition_id)

    @user = registration.user
    @results = registration.live_results.includes([:live_attempts])
  end
end
