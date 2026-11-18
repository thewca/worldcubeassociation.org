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

  private def person
    @person ||= Person.current.find_by!(wca_id: params.require(:wca_id))
  end

  private def person_results
    # `attempts` reads `result_attempts`, and the competition columns and `ranking` come off their
    # associations, so all three have to be preloaded or every row fires its own query. `person` is
    # preloaded so that every result shares one Person (and so one User), which loads the matches once.
    person.results.includes(:competition, :result_attempts, :person, round: :linked_round)
  end

  # `stale?` only sees the person's own result rows, but the response also depends on their matches,
  # sets and attempts, and on the whole round's standings (opponents' `final_pos`). Each is reduced to
  # a row count (to notice deletions) plus its newest `updated_at`.
  private def h2h_etag_parts
    matches = person.user&.h2h_matches&.except(:includes) || H2hMatch.none
    match_fingerprint = fingerprint(matches)
    return [match_fingerprint] if match_fingerprint.first.zero?

    round_ids = matches.select(:round_id)
    sets = H2hSet.where(h2h_match_id: matches.select(:id))
    attempts = H2hAttempt.where(h2h_set_id: sets.select(:id))

    [match_fingerprint, *[sets, attempts, Result.where(round_id: round_ids), LiveResult.where(round_id: round_ids)].map { fingerprint(it) }]
  end

  private def fingerprint(relation)
    # `pick` is nil for a `none` relation (a person without a user account).
    relation.pick(Arel.sql("COUNT(*)"), relation.arel_table[:updated_at].maximum) || [0, nil]
  end

  private def render_results(results)
    # Passing `etag:` replaces the relation's own contribution to the ETag, so it is listed explicitly.
    return unless stale?(results, etag: [results, h2h_etag_parts], public: true)

    render json: results.as_json(Result::V1_SERIALIZE_OPTIONS)
  end
end
