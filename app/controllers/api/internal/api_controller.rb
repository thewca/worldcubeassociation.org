# frozen_string_literal: true

class Api::Internal::ApiController < ActionController::API
  # Manually include new Relic because we don't derive from ActionController::Base
  include NewRelic::Agent::Instrumentation::ControllerInstrumentation if Rails.env.production?

  def results
    person = Person.current.includes(:user, :ranksSingle, :ranksAverage, :competitions).find_by!(wca_id: params[:person_id])
    previous_persons = Person.where(wca_id: params[:person_id]).where.not(subId: 1).order(:subId)
    ranks_single = person.ranksSingle.select { |r| r.event.official? }
    ranks_average = person.ranksAverage.select { |r| r.event.official? }
    medals = person.medals
    records = person.records
    results = person.results.includes(:competition, :event, :format, :round_type).order("Events.rank, Competitions.start_date DESC, Competitions.id, RoundTypes.rank DESC")
    championship_podiums = person.championship_podiums
    render json: {
      person: person,
      previous_persons: previous_persons,
      ranks_single: ranks_single,
      ranks_average: ranks_average,
      medals: medals,
      records: records,
      championship_podiums: championship_podiums,
      results: results,
    }
  end
end
