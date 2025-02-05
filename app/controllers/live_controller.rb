# frozen_string_literal: true

class LiveController < ApplicationController
  def schedule_admin
    @competition_id = params.require(:competition_id)
    @competition = Competition.find(@competition_id)

    @rounds = Round.joins(:competition_event).where(competition_event: { competition_id: @competition_id })
  end

  def open_round
    round_id = params.require(:round_id)
    competition_id = params.require(:competition_id)
    round = Round.find(round_id)

    if round.is_open?
      flash[:danger] = "Round is already open"
      return redirect_to live_schedule_admin_path(competition_id: competition_id)
    end

    unless round.round_can_be_opened?
      flash[:danger] = "You can't open this round yet"
      return redirect_to live_schedule_admin_path(competition_id: competition_id)
    end

    round.update(is_open: true)
    flash[:success] = "Successfully opened round"
    redirect_to live_schedule_admin_path(competition_id: competition_id)
  end
end
