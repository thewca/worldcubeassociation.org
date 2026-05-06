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

  validate do
    remaining_rounds = rounds.reject(&:marked_for_destruction?)
    numbers = remaining_rounds.map(&:number).sort
    errors.add(:rounds, "#{numbers} is wrong") if numbers != (1..remaining_rounds.length).to_a
  end

  def advancing_competitor_ids
    registrations.accepted.ids
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
    qualification&.to_s(self)
  end

  def can_register?(user)
    competition.allow_registration_without_qualification || qualification.nil? || qualification.can_register?(user, event_id)
  end

  def as_wcif_participation_source(_target_round)
    {
      "type" => "registrations",
    }
  end

  def v2_qualification_wcif
    return nil if qualification_condition.blank?

    {
      "earliestResultDate" => nil,
      "latestResultDate" => qualification_latest_date&.strftime("%Y-%m-%d"),
      "resultCondition" => qualification_condition,
    }
  end

  def to_wcif(version: Competition::WCIF_STABLE_VERSION)
    at_least_v2 = Gem::Version.new(version) >= Gem::Version.new("2.0.0")

    {
      "id" => self.event.id,
      "rounds" => self.rounds.map { it.to_wcif(version: version) },
      "extensions" => wcif_extensions.map(&:to_wcif),
      "qualification" => at_least_v2 ? v2_qualification_wcif : qualification&.to_wcif,
    }
  end

  def self.load_wcif_qualification(wcif_event, version: Competition::WCIF_STABLE_VERSION)
    if Gem::Version.new(version) >= Gem::Version.new("2.0.0")
      json_obj = wcif_event['qualification']

      # Most events actually don't have a qualification, so return early.
      return nil if json_obj.nil?

      result_condition = json_obj['resultCondition']

      v2_wcif_type = result_condition['type']
      v1_wcif_type = result_condition['value'].present? ? v2_wcif_type.gsub('resultAchieved', 'attemptResult') : v2_wcif_type.gsub('resultAchieved', 'anyResult')

      Qualification.new(
        wcif_type: v1_wcif_type,
        when_date: Date.iso8601(json_obj['latestResultDate']),
        result_type: result_condition['scope'],
        level: result_condition['value'],
      )
    else
      Qualification.load(wcif_event["qualification"])
    end
  end

  def load_wcif!(wcif, current_user, version: Competition::WCIF_STABLE_VERSION)
    if self.rounds.pluck(:old_type).compact.any?
      raise WcaExceptions::BadApiParameter.new(
        "Cannot edit rounds for a competition which has qualification rounds or b-finals. Please contact WRT or WST if you need to make change to this competition.",
      )
    end
    model_rounds = wcif["rounds"].map do |round_wcif|
      round = rounds.find { it.wcif_id == round_wcif["id"] } || rounds.build
      round.update!(**Round.wcif_to_round_attributes(self.event, round_wcif, wcif["rounds"], version: version))
      WcifExtension.update_wcif_extensions!(round, round_wcif["extensions"]) if round_wcif["extensions"]
      round
    end
    # Have to do this in a second pass because nested associations (mostly `linked_round` and `participation_source`)
    #   need the record to already exist in the database in order to reference their IDs
    new_rounds = model_rounds.map do |round|
      round.update!(**Round.wcif_backlinking(round, model_rounds))
      round
    end
    # This is not techincally a third pass, because we're not updating the round itself.
    #   But for the advancement through rounds, the whole CE already needs to be fully linked up
    new_rounds.zip(wcif["rounds"]).each do |round, round_wcif|
      round.load_live_results!(round_wcif["results"], current_user) if round_wcif["results"].present?
    end
    wcif_qualification = CompetitionEvent.load_wcif_qualification(wcif, version: version)
    self.update!(
      rounds: new_rounds,
      qualification: wcif_qualification,
      qualification_latest_date: wcif_qualification&.when_date,
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
                               "earliestResultDate" => { "type" => "string" },
                               "latestResultDate" => { "type" => "string" },
                               "resultCondition" => ResultConditions::ResultCondition.wcif_json_schema,
                             },
                           }
                         else
                           Qualification.wcif_json_schema
                         end,
      "extensions" => { "type" => "array", "items" => WcifExtension.wcif_json_schema },
    }
  end
end
