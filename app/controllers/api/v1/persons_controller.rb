# frozen_string_literal: true

class Api::V1::PersonsController < Api::V1::ApiController
  # A person's results are public data — the profile page renders them for signed-out visitors.
  skip_before_action :require_user!

  # Matches are only rendered alongside a posted `Result`, and posting a round clears out its live results
  # (see `h2h_results_import.rake`), so the opponents' `final_pos` always comes from the round's `results`.
  H2H_MATCH_INCLUDES = [*H2hMatch::SERIALIZATION_INCLUDES, { round: { results: { person: :user } } }].freeze

  def results
    # `participated_matches` goes through each result's person and user, so that chain is preloaded too.
    results = person_results.includes(person: { user: { h2h_matches: H2H_MATCH_INCLUDES } })
    results = results.in_event(params[:event_id]) if params[:event_id].present?

    # The response also depends on data outside the person's own result rows, which `stale?` can't see by itself.
    # Only an ETag is sent: a Last-Modified derived from `results` alone would miss those changes.
    return unless stale?(etag: [results, h2h_etag_parts], public: true)

    render json: results.as_json(Result::V1_PERSON_RESULTS_SERIALIZE_OPTIONS)
  end

  def records
    results = person_results

    single_records = results.where.not(regional_single_record: [nil, ''])
    average_records = results.where.not(regional_average_record: [nil, ''])
    records = single_records.or(average_records)

    return unless stale?(records, public: true)

    render json: records.as_json(Result::V1_SERIALIZE_OPTIONS)
  end

  private def person
    @person ||= Person.current.find_by!(wca_id: params.require(:wca_id))
  end

  private def person_results
    # `attempts` reads `result_attempts`, and the competition columns and `ranking` come off their
    # associations, so all three have to be preloaded or every row fires its own query.
    person.results.includes(:competition, :result_attempts, round: :linked_round)
  end

  # Fingerprints the person's matches, plus the standings of every round they competed in a match in (opponents'
  # `final_pos`). Sets and attempts touch their match, so the match fingerprint covers them too. Each part is a
  # row count (to notice deletions) plus its newest `updated_at`.
  private def h2h_etag_parts
    matches = person.user&.h2h_matches || H2hMatch.none
    match_fingerprint = fingerprint(matches)
    return [match_fingerprint] if match_fingerprint.first.zero?

    [match_fingerprint, fingerprint(Result.where(round_id: matches.select(:round_id)))]
  end

  private def fingerprint(relation)
    # `pick` is nil for a `none` relation (a person without a user account). The aggregate has no use for
    # an association's ordering, which MySQL would reject alongside `COUNT(*)`.
    relation.unscope(:order).pick(Arel.sql("COUNT(*)"), relation.arel_table[:updated_at].maximum) || [0, nil]
  end
end
