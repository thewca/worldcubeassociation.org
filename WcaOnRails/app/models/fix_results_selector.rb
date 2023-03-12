# frozen_string_literal: true

class FixResultsSelector
  include ActiveModel::Model

  attr_accessor :person_id
  attr_writer :competition_id, :event_id, :round_type_id

  def person
    @person ||= Person.find_by(wca_id: @person_id)
  end

  def person_hint(template)
    person ? "#{person.name}, #{template.flag_icon(person.country.iso2)} #{person.country.name}".html_safe : false
  end

  def eligible_competitions
    person.competitions
          .sort_by(&:start_date)
          .reverse
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

  def result_or_repeat_link(resolver)
    # simple_form does not allow nil as URL value, but in the middle of the process
    # we don't know the actual redirect value yet. So just set the current page as a dummy value instead.
    person && selected_result ? resolver.edit_result_path(selected_result) : resolver.admin_fix_results_path
  end
end
