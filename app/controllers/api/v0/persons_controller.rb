# frozen_string_literal: true

class Api::V0::PersonsController < Api::V0::ApiController
  def index
    persons = if params[:q].present?
                Person.search(params[:q])
              else
                Person.current.includes(:user)
              end
    persons = persons.includes(:ranksSingle, :ranksAverage)
    persons = persons.where(wca_id: params[:wca_ids].split(',')) if params[:wca_ids].present?
    render json: paginate(persons).map { |person| person_to_json person }
  end

  def show
    wca_id = params[:wca_id]
    person = Person.current.includes(:user, :ranksSingle, :ranksAverage).find_by!(wca_id: wca_id)
    private_attributes = person.private_attributes_for_user(current_user)
    return unless stale?(person, public: true)

    render json: person_to_json(person, private_attributes)
  end

  def results
    event = params[:event_id]
    person = Person.current.find_by!(wca_id: params[:wca_id])
    results = if event.present?
                person.results.where(event_id: event)
              else
                person.results
              end

    return unless stale?(results, public: true)

    render json: results
  end

  def competitions
    person = Person.current.find_by!(wca_id: params[:wca_id])
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
