# frozen_string_literal: true

class LiveController < ApplicationController
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
end
