# frozen_string_literal: true

class Api::Internal::V1::CompetitionsController < Api::Internal::V1::ApiController
  # We are using our own authentication method with vault
  protect_from_forgery except: [:show, :qualifications]

  def show
    competition = competition_from_params

    if stale?(competition)
      render json: competition.to_competition_info
    end
  end

  def qualifications
    competition = competition_from_params(associations: [:competition_events])

    render json: competition.qualification_wcif
  end

  private def competition_from_params(associations: {})
    id = params[:competition_id]
    competition = Competition.includes(associations).find_by_id(id)

    raise WcaExceptions::NotFound.new("Competition with id #{id} not found") unless competition
    competition
  end
end
