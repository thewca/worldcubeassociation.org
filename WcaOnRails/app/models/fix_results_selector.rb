# frozen_string_literal: true

class FixResultsSelector
  include ActiveModel::Model

  attr_accessor :person_id
  attr_writer :competition_id, :event_id, :round_type_id

  def person
    Person.find_by(wca_id: @person_id)
  end

  def eligible_competitions
    person.competitions
          .sort_by(&:start_date)
  end

  def competition_id
    @competition_id ||= eligible_competitions.first&.id
  end

  def eligible_events
    person.results
          .filter { |r| r.competition_id == competition_id }
          .map(&:event)
          .sort_by(&:rank)
          .uniq
  end

  def event_id
    @event_id ||= eligible_events.first&.id
  end

  def eligible_round_types
    person.results
          .filter { |r| r.competition_id == competition_id }
          .filter { |r| r.event_id == event_id }
          .map(&:round_type)
          .sort_by(&:rank)
          .uniq
  end

  def round_type_id
    @round_type_id ||= eligible_round_types.first&.id
  end

  def selected_result
    person.results
          .filter { |r| r.competition_id == competition_id }
          .filter { |r| r.event_id == event_id }
          .filter { |r| r.round_type_id == round_type_id }
          .first
  end
end
