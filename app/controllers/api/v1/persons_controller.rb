# frozen_string_literal: true

class Api::V1::PersonsController < Api::V1::ApiController
  # A Person's results are public data
  skip_before_action :require_user!

  def show
    person = Person.current.includes(:user, :ranks_single, :ranks_average).find_by!(wca_id: params.require(:wca_id))

    render json: person.to_v1_json
  end

  def results
    results = person_results
    results = results.in_event(params[:event_id]) if params[:event_id].present?

    # Paginated by competition rather than by result, so that a page never splits a competition's rounds.
    competitions = paginate Competition.where(id: results.select(:competition_id)).order(start_date: :desc, id: :desc)

    h2h_match_includes = [*H2hMatch::SERIALIZATION_INCLUDES, { round: { results: { person: :user } } }]
    # MySQL does not support LIMIT inside an IN subquery, so the page's competition ids are plucked first.
    page_results = results.where(competition_id: competitions.ids)
                          .includes(person: { user: { h2h_matches: h2h_match_includes } })

    personal_best_ids_by_type = results.personal_best_ids_by_type

    serialized_results = page_results.as_json(
      only: Result::V1_STANDALONE_SERIALIZE_OPTIONS[:only],
      methods: Result::V1_STANDALONE_SERIALIZE_OPTIONS[:methods] | %w[participated_matches],
    )

    render json: serialized_results.map { |result_json|
      result_json.merge(
        "is_personal_best_single" => personal_best_ids_by_type[:best].include?(result_json["id"]),
        "is_personal_best_average" => personal_best_ids_by_type[:average].include?(result_json["id"]),
      )
    }
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
