# frozen_string_literal: true

class Api::V0::PersonsController < Api::V0::ApiController
  def index
    if params[:q].present?
      persons = Person.search(params[:q])
    else
      persons = Person.current.includes(:user)
    end
    persons = persons.includes(:ranksSingle, :ranksAverage)
    if params[:wca_ids].present?
      persons = persons.where(wca_id: params[:wca_ids].split(','))
    end
    render json: paginate(persons).map { |person| person_to_json person }
  end

  def show
    person = Person.current.includes(:user, :ranksSingle, :ranksAverage).find_by_wca_id!(params[:wca_id])
    render json: person_to_json(person)
  end

  def results
    person = Person.current.find_by_wca_id!(params[:wca_id])
    render json: person.results
  end

  def competitions
    person = Person.current.find_by_wca_id!(params[:wca_id])
    render json: person.competitions
  end

  private def person_to_json(person)
    {
      person: person.serializable_hash(only: [:wca_id, :name, :url, :gender, :country_iso2, :delegate_status, :teams, :avatar]),
      competition_count: person.competitions.count,
      personal_records: person.ranksSingle.each_with_object({}) do |rank_single, ranks|
        event_id = rank_single.event.id
        rank_average = person.ranksAverage.find { |rank| rank.event_id == event_id }
        ranks[event_id] = { single: rank_to_json(rank_single) }
        ranks[event_id][:average] = rank_to_json(rank_average) if rank_average
      end,
      medals: person.medals,
      records: person.records,
    }
  end

  private def rank_to_json(rank)
    {
      best: rank.best,
      world_rank: rank.world_rank,
      continent_rank: rank.continent_rank,
      country_rank: rank.country_rank,
    }
  end

  def can_claim
    wca_id = params.require(:wca_id)
    user = User.new
    user.unconfirmed_wca_id = wca_id
    if !user.unconfirmed_person
      render json: { can_claim: false, reason: 'wca_id_not_found' }
    elsif user.unconfirmed_person.user && !user.unconfirmed_person.user.dummy_account?
      render json: { can_claim: false, reason: 'wca_id_already_claimed' }
    elsif !user.unconfirmed_person.dob
      render json: { can_claim: false, reason: 'dob_not_found' }
    else
      render json: { can_claim: true }
    end
  end

  def likely_delegates
    wca_id = params.require(:wca_id)
    person = Person.current.find_by_wca_id!(wca_id)
    render json: { likely_delegates: person.likely_delegates }
  end
end
