# frozen_string_literal: true

class Api::V1::PersonsController < Api::V1::ApiController
  # A person's results are public data — the profile page renders them for signed-out visitors.
  skip_before_action :require_user!

  def show
    person = Person.current.includes(:ranks_single, :ranks_average).find_by!(wca_id: params.require(:wca_id))

    render json: {
      person: person.serializable_hash(only: %i[wca_id name url gender country_iso2 delegate_status teams avatar]),
      competition_count: person.competitions.count,
      personal_records: personal_records(person),
      medals: person.medals,
      records: person.records,
      total_solves: person.completed_solves_count,
      championship_podiums: person.championship_podiums.transform_values { it.as_json(Result::V1_SERIALIZE_OPTIONS) },
    }
  end

  def results
    results = person_results
    results = results.in_event(params[:event_id]) if params[:event_id].present?

    render_results results
  end

  def records
    results = person_results

    single_records = results.where.not(regional_single_record: [nil, ''])
    average_records = results.where.not(regional_average_record: [nil, ''])

    render_results single_records.or(average_records)
  end

  # A person can have a single but not an average, but never an average without a single,
  # which is why the singles are the base for the lookup.
  private def personal_records(person)
    ranks_average_by_event = person.ranks_average.index_by(&:event_id)

    person.ranks_single.index_by(&:event_id).transform_values do |rank_single|
      {
        single: rank_single,
        average: ranks_average_by_event[rank_single.event_id],
      }.compact
    end
  end

  private def person_results
    person = Person.current.find_by!(wca_id: params.require(:wca_id))

    # `attempts` reads `result_attempts`, and the competition columns come off the association,
    # so both have to be preloaded or every row fires its own query.
    person.results.includes(:competition, :result_attempts)
  end

  private def render_results(results)
    return unless stale?(results, public: true)

    render json: results.as_json(Result::V1_SERIALIZE_OPTIONS)
  end
end
