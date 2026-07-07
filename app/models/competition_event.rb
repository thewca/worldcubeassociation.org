# frozen_string_literal: true

class CompetitionEvent < ApplicationRecord
  belongs_to :competition
  belongs_to :event

  has_one :waiting_list, dependent: :destroy, as: :holder
  has_many :registration_competition_events, dependent: :destroy
  has_many :registrations, through: :registration_competition_events
  has_many :rounds, -> { order(:number) }, dependent: :destroy, inverse_of: :competition_event
  has_many :wcif_extensions, as: :extendable, dependent: :delete_all
  has_many :formats, through: :rounds
  has_many :preferred_formats, through: :event
  has_many :target_rounds, class_name: "Round", as: :participation_source

  accepts_nested_attributes_for :rounds, allow_destroy: true

  validates :fee_lowest_denomination, numericality: { greater_than_or_equal_to: 0 }
  monetize :fee_lowest_denomination,
           as: "fee",
           with_model_currency: :currency_code

  serialize :qualification, coder: Qualification
  validates_associated :qualification

  serialize :qualification_condition, coder: ResultConditions::ResultCondition
  validates_associated :qualification_condition

  validates :qualification_latest_date, presence: { if: :qualification_condition? }

  validate do
    remaining_rounds = rounds.reject(&:marked_for_destruction?)
    numbers = remaining_rounds.map(&:number).sort
    errors.add(:rounds, "#{numbers} is wrong") if numbers != (1..remaining_rounds.length).to_a
  end

  def advancing_competitor_ids
    live_competitors.ids
  end

  def live_competitors
    registrations.accepted.competing
  end

  def advancement_results
    []
  end

  def score_taking_done?
    true
  end

  def currency_code
    competition&.currency_code
  end

  def paid_entry?
    fee.nonzero?
  end

  def event
    Event.c_find(event_id)
  end

  def recommended_format
    preferred_formats.first&.format
  end

  def qualification_to_s
    case qualification_condition
    when ResultConditions::Ranking
      I18n.t("qualification.#{qualification_condition.scope}.ranking", ranking: qualification_condition.value)
    when ResultConditions::ResultAchieved
      if qualification_condition.value.nil?
        I18n.t("qualification.#{qualification_condition.scope}.any_result")
      elsif event.timed_event?
        I18n.t("qualification.#{qualification_condition.scope}.time", time: SolveTime.centiseconds_to_clock_format(qualification_condition.value))
      elsif event.fewest_moves?
        moves = qualification_condition.scope == "average" ? (qualification_condition.value / 100.0).round(2) : qualification_condition.value
        I18n.t("qualification.#{qualification_condition.scope}.moves", moves: moves)
      elsif event.multiple_blindfolded?
        I18n.t("qualification.#{qualification_condition.scope}.points", points: SolveTime.multibld_attempt_to_points(qualification_condition.value))
      end
    end
  end

  def meets_qualification?(user)
    return true if qualification_condition.nil?

    before_deadline_results = user.person.results
                                  .in_event(self.event_id)
                                  .on_or_before(self.qualification_latest_date)

    case qualification_condition
    # Allow any competitor with a result to register when type == "ranking".
    # When type == "ranking", the results need to be manually cleared out later.
    when ResultConditions::Ranking
      case qualification_condition.scope
      when "single"
        before_deadline_results.succeeded.any?
      when "average"
        before_deadline_results.average_succeeded.any?
      end
    when ResultConditions::ResultAchieved
      if qualification_condition.value.nil?
        case qualification_condition.scope
        when "single"
          before_deadline_results.succeeded.any?
        when "average"
          before_deadline_results.average_succeeded.any?
        end
      else
        case qualification_condition.scope
        when "single"
          before_deadline_results.single_better_than(qualification_condition.value).any?
        when "average"
          before_deadline_results.average_better_than(qualification_condition.value).any?
        end
      end
    end
  end

  def can_register?(user)
    competition.allow_registration_without_qualification || self.meets_qualification?(user)
  end

  def as_wcif_participation_source(_target_round)
    {
      "type" => "registrations",
    }
  end

  def v1_qualification_wcif
    return nil if qualification_condition.blank?

    v2_wcif_type = qualification_condition.class.wcif_type
    v1_backported_type = v2_wcif_type == 'resultAchieved' && qualification_condition.value.nil ? "anyResult" : v2_wcif_type.gsub("resultAchieved", "attemptResult")

    {
      "type" => v1_backported_type,
      "resultType" => qualification_condition.scope,
      "whenDate" => qualification_latest_date&.strftime("%Y-%m-%d"),
      "level" => qualification_condition.value,
    }
  end

  def v2_qualification_wcif
    return nil if qualification_condition.blank?

    {
      "earliestResultDate" => nil,
      "latestResultDate" => qualification_latest_date&.strftime("%Y-%m-%d"),
      "resultCondition" => qualification_condition.to_wcif,
    }
  end

  def to_wcif(version: Competition::WCIF_STABLE_VERSION, include_results: true)
    at_least_v2 = Gem::Version.new(version) >= Gem::Version.new("2.0.0")

    {
      "id" => self.event.id,
      "rounds" => self.rounds.map { it.to_wcif(version: version, include_results: include_results) },
      "extensions" => wcif_extensions.map(&:to_wcif),
      "qualification" => at_least_v2 ? v2_qualification_wcif : v1_qualification_wcif,
    }
  end

  def load_wcif!(wcif, current_user, version: Competition::WCIF_STABLE_VERSION)
    if self.rounds.pluck(:old_type).compact.any?
      raise WcaExceptions::BadApiParameter.new(
        "Cannot edit rounds for a competition which has qualification rounds or b-finals. Please contact WRT or WST if you need to make change to this competition.",
      )
    end
    at_least_v2 = Gem::Version.new(version) >= Gem::Version.new("2.0.0")
    if at_least_v2
      wcif["rounds"].each do |wcif_round|
        next if (linked_rounds = wcif_round["linkedRounds"]).blank?

        raise WcaExceptions::BadApiParameter.new("The linking for round #{wcif_round['id']} must contain itself") unless linked_rounds.include?(wcif_round["id"])
        raise WcaExceptions::BadApiParameter.new("The linking for round #{wcif_round['id']} must be longer than one entry") if linked_rounds.length <= 1

        defined_round_ids = wcif["rounds"].pluck("id")
        non_existing_round_ids = linked_rounds.reject { defined_round_ids.include?(it) }

        raise WcaExceptions::BadApiParameter.new("The linking for round #{wcif_round['id']} references non-existing rounds [#{non_existing_round_ids.join(',')}]") unless non_existing_round_ids.empty?

        non_matching_siblings = linked_rounds.filter do |sibling_wcif_id|
          sibling_matching = wcif["rounds"].find { it["id"] == sibling_wcif_id }&.dig("linkedRounds")

          linked_rounds != sibling_matching
        end

        raise WcaExceptions::BadApiParameter.new("The linking for round #{wcif_round['id']} does not match the linking of rounds [#{non_matching_siblings.join(',')}]") unless non_matching_siblings.empty?
      end
    end
    model_rounds = wcif["rounds"].map do |round_wcif|
      round = rounds.find { it.wcif_id == round_wcif["id"] } || rounds.build
      round_attributes = Round.wcif_to_round_attributes(self.event, round_wcif, wcif["rounds"], version: version)
      # For internal-scoretaking comps `live_results` is the source of truth and `round_results`
      #   is never read back (see `Round#to_wcif`). Persisting the WCIF snapshot just creates
      #   stale data that drifts from `live_results`, so we don't store it (and clear any leftovers).
      round_attributes[:round_results] = [] if self.competition.scoretaking_software_internal?
      round.update!(**round_attributes)
      WcifExtension.update_wcif_extensions!(round, round_wcif["extensions"]) if round_wcif["extensions"]
      round
    end
    previously_linked_rounds = model_rounds.filter_map(&:linked_round)
    # Have to do this in a second pass because nested associations (mostly `linked_round` and `participation_source`)
    #   need the record to already exist in the database in order to reference their IDs
    new_rounds = wcif["rounds"].zip(model_rounds).map do |round_wcif, round|
      if at_least_v2
        # Linked Round already needs to be present for computing the backlinking below
        round.linked_round = Round.compute_linked_round(round_wcif, round, model_rounds)
      end

      round.update!(**Round.backport_participation_ruleset(round, model_rounds))
      round
    end
    previously_linked_rounds.each(&:destroy_if_orphaned)
    # This is not techincally a third pass, because we're not updating the round itself.
    #   But for the advancement through rounds, the whole CE already needs to be fully linked up
    new_rounds.zip(wcif["rounds"]).each do |round, round_wcif|
      round.load_live_results!(round_wcif["results"], current_user) if round_wcif["results"].present?
    end
    wcif_qualification = wcif["qualification"]
    using_v2 = Gem::Version.new(version) >= Gem::Version.new("2.0.0")
    wcif_qualification_date = using_v2 ? wcif_qualification["latestResultDate"] : wcif["whenDate"]
    self.update!(
      rounds: new_rounds,
      qualification_latest_date: Date.iso8601(wcif_qualification_date),
      qualification_condition: ResultConditions::Utils.upcycle_v1_qualification(wcif_qualification),
    )
    WcifExtension.update_wcif_extensions!(self, wcif["extensions"]) if wcif["extensions"]
    self
  end

  def self.wcif_json_schema(version: Competition::WCIF_STABLE_VERSION)
    {
      "type" => "object",
      "properties" => self.wcif_json_schema_properties(version: version),
    }
  end

  def self.wcif_json_schema_properties(version: Competition::WCIF_STABLE_VERSION)
    {
      "id" => { "type" => "string" },
      "rounds" => { "type" => %w[array null], "items" => Round.wcif_json_schema(version: version) },
      "competitorLimit" => { "type" => %w[integer null] },
      "qualification" => if Gem::Version.new(version) >= Gem::Version.new("2.0.0")
                           {
                             "type" => %w[object null],
                             "properties" => {
                               "earliestResultDate" => { "type" => %w[string null], "format" => "date" },
                               "latestResultDate" => { "type" => "string", "format" => "date" },
                               "resultCondition" => ResultConditions::ResultCondition.wcif_json_schema,
                             },
                           }
                         else
                           {
                             "type" => %w[object null],
                             "properties" => {
                               "whenDate" => { "type" => "string" },
                               "resultType" => { "type" => "string", "enum" => %w[single average] },
                               "type" => { "type" => "string", "enum" => %w[attemptResult ranking anyResult] },
                               "level" => { "type" => %w[integer null] },
                             },
                           }
                         end,
      "extensions" => { "type" => "array", "items" => WcifExtension.wcif_json_schema },
    }
  end
end
