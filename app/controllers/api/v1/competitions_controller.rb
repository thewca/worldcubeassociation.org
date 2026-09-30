# frozen_string_literal: true

class Api::V1::CompetitionsController < Api::V1::ApiController
  # Posted results are public data — the competition results pages render them for signed-out visitors.
  skip_before_action :require_user!

  before_action :set_competition

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
