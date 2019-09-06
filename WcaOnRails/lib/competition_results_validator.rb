# frozen_string_literal: true

class CompetitionResultsValidator
  attr_reader :total_errors, :total_warnings, :errors, :warnings, :has_results, :persons, :persons_by_id, :results, :scrambles, :number_of_non_matching_rounds, :expected_rounds_by_ids, :check_real_results

  # List of all possible errors and warnings for the results

  def initialize(competition_id, check_real_results = false)
    @errors = {
      persons: [],
      events: [],
      rounds: [],
      results: [],
      scrambles: [],
    }
    @warnings = {
      persons: [],
      results: [],
      rounds: [],
      events: [],
    }
    @total_errors = 0
    @total_warnings = 0
    @number_of_non_matching_rounds = 0

    associations = {
      events: [],
      competition_events: {
        rounds: [:competition_event, :format],
      },
    }

    @competition = Competition.includes(associations).find(competition_id)

    @check_real_results = check_real_results

    result_model = @check_real_results ? Result : InboxResult
    @results = result_model.sorted_for_competitions(competition_id)
    @has_results = @results.any?
    unless @has_results
      @total_errors = 1
      @errors[:results] << "The competition has no result."
      return
    end

    @persons = if @check_real_results
                 @competition.competitors
               else
                 InboxPerson.where(competitionId: competition_id)
               end

    @scrambles = Scramble.where(competitionId: competition_id)

    # check persons
    # basic checks on persons are done in the model, uniqueness for a given competition
    # is done in the SQL schema.

    # Map a personId to its corresponding object.
    # When dealing with Persons from "InboxPerson" they are indexed by "id",
    # whereas when dealing with Persons from "Person" they are indexed by "wca_id".
    @persons_by_id = Hash[@persons.map { |person| [@check_real_results ? person.wca_id : person.id, person] }]

    # Map a competition's (expected!) round id (eg: "444-f") to its corresponding object
    @expected_rounds_by_ids = Hash[@competition.competition_events.map(&:rounds).flatten.map { |r| ["#{r.event.id}-#{r.round_type_id}", r] }]

    # Ensure any call to localizable name (eg: round names) is made in English,
    # as all errors and warnings are in English.
    I18n.with_locale(:en) do
      validator_classes = [
        ResultsValidators::EventsRoundsValidator,
        ResultsValidators::PositionsValidator,
        ResultsValidators::IndividualResultsValidator,
        ResultsValidators::ScramblesValidator,
        ResultsValidators::CompetitorLimitValidator,
        ResultsValidators::AdvancementConditionsValidator,
        ResultsValidators::PersonsValidator,
      ]
      merge(validator_classes.map { |v| v.new.validate(results: @results, model: result_model) })
    end

    @total_errors = @errors.values.sum(&:size)
    @total_warnings = @warnings.values.sum(&:size)
  end

  private

  def merge(other_validators)
    unless other_validators.respond_to?(:each)
      other_validators = [other_validators]
    end
    other_validators.each do |v|
      v.errors.group_by(&:kind).each do |kind, errors|
        @errors[kind].concat(errors)
      end
      v.warnings.group_by(&:kind).each do |kind, warnings|
        @warnings[kind].concat(warnings)
      end
    end
    @total_errors = @errors.values.sum(&:size)
    @total_warnings = @warnings.values.sum(&:size)
  end
end
