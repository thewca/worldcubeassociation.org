# frozen_string_literal: true

class Api::V1::PersonsController < Api::V1::ApiController
  # A person's results are public data — the profile page renders them for signed-out visitors.
  skip_before_action :require_user!

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

  private def person_results
    person = Person.current.find_by!(wca_id: params.require(:wca_id))

    # `attempts` reads `result_attempts`, and the competition columns and `ranking` come off their
    # associations, so all three have to be preloaded or every row fires its own query.
    person.results.includes(:competition, :result_attempts, round: :linked_round)
  end

  private def render_results(results)
    return unless stale?(results, public: true)

    render json: results.as_json(Result::V1_SERIALIZE_OPTIONS)
  end
end
