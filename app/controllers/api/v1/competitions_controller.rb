# frozen_string_literal: true

class Api::V1::CompetitionsController < Api::V1::ApiController
  # Posted results are public data — the competition results pages render them for signed-out visitors.
  skip_before_action :require_user!

  # Mirrors the WCA Live landing page, which lists everything from one month back.
  LIVE_COMPETITIONS_LOOKBACK = 1.month

  def live
    competitions = Competition.visible
                              .not_cancelled
                              .scoretaking_software_internal
                              .where(end_date: LIVE_COMPETITIONS_LOOKBACK.ago.to_date..)
                              .includes(:events, :championships)
                              .order_by_date

    upcoming, started = competitions.partition(&:upcoming?)
    in_progress, past = started.partition(&:in_progress?)

    render json: {
      upcoming: upcoming.as_json(Competition::INDEX_SERIALIZE_OPTIONS),
      in_progress: in_progress.as_json(Competition::INDEX_SERIALIZE_OPTIONS),
      past: past.reverse.as_json(Competition::INDEX_SERIALIZE_OPTIONS),
    }
  end

  before_action :set_competition, except: %i[live]

  # Every round of the competition with its results nested, ordered by event and round number.
  # The frontend regroups these by event or by person; the round carries the context that would
  # otherwise be repeated on each of its results.
  def results
    rounds = @competition.rounds
                         .includes(:competition_event, :linked_round, results: :result_attempts)
                         .sort_by { [it.event.rank, it.number] }

    return unless stale?(@competition.results, public: true)

    render json: rounds.map(&:to_v1_results_json)
  end

  def podiums
    return unless stale?(@competition.results, public: true)

    render json: @competition.to_v1_podiums_json
  end

  private def set_competition
    @competition = Competition.find(params.require(:competition_id))
  end
end
