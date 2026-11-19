# frozen_string_literal: true

class Api::V1::PersonsController < Api::V1::ApiController
  # A Person's results are public data
  skip_before_action :require_user!

  def results
    h2h_match_includes = [*H2hMatch::SERIALIZATION_INCLUDES, { round: { results: { person: :user } } }]
    results = person_results.includes(person: { user: { h2h_matches: h2h_match_includes } })
    results = results.in_event(params[:event_id]) if params[:event_id].present?

    render json: results.as_json(
      only: Result::V1_STANDALONE_SERIALIZE_OPTIONS[:only],
      methods: Result::V1_STANDALONE_SERIALIZE_OPTIONS[:methods] | %w[participated_matches],
    )
  end

  def records
    results = person_results

    single_records = results.where.not(regional_single_record: [nil, ''])
    average_records = results.where.not(regional_average_record: [nil, ''])
    records = single_records.or(average_records)

    return unless stale?(records, public: true)

    render json: records.as_json(Result::V1_STANDALONE_SERIALIZE_OPTIONS)
  end

  private def person_results
    person = Person.current.find_by!(wca_id: params.require(:wca_id))
    person.results.includes(:competition, :result_attempts, round: :linked_round)
  end
end
