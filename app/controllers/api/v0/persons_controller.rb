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
    private_attributes = []
    if current_user && current_user.can_admin_results?
      private_attributes = %w[incorrect_wca_id_claim_count dob]
    end
    render json: person_to_json(person, private_attributes)
  end

  def results
    person = Person.current.find_by_wca_id!(params[:wca_id])
    render json: person.results
  end

  def competitions
    person = Person.current.find_by_wca_id!(params[:wca_id])
    render json: person.competitions
  end

  def personal_records
    person = Person.find_by(wca_id: params.require(:wca_id))

    render json: person.personal_records.map(&:to_wcif)
  end

  private def person_to_json(person, private_attributes = [])
    {
      person: person.serializable_hash(only: [:wca_id, :name, :url, :gender, :country_iso2, :delegate_status, :teams, :avatar], private_attributes: private_attributes),
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
end
