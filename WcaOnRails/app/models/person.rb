# frozen_string_literal: true

class Person < ApplicationRecord
  self.table_name = "Persons"

  has_one :user, primary_key: "wca_id", foreign_key: "wca_id"
  has_many :results, primary_key: "wca_id", foreign_key: "personId"
  has_many :competitions, -> { distinct }, through: :results
  has_many :ranksAverage, primary_key: "wca_id", foreign_key: "personId", class_name: "RanksAverage"
  has_many :ranksSingle, primary_key: "wca_id", foreign_key: "personId", class_name: "RanksSingle"

  enum gender: (User::ALLOWABLE_GENDERS.to_h { |g| [g, g.to_s] })

  alias_attribute :ref_id, :wca_id

  scope :current, -> { where(subId: 1) }

  scope :in_region, lambda { |region_id|
    unless region_id.blank? || region_id == 'all'
      where(countryId: (Continent.country_ids(region_id) || region_id))
    end
  }

  validates :name, presence: true
  validates_inclusion_of :countryId, in: Country.real.map(&:id).freeze

  # If creating a brand new person (ie: with subId equal to 1), then the
  # WCA ID must be unique.
  # Note: in general WCA ID are not unique in the table, as one person with
  # the same WCA ID may have multiple subIds (eg: if they changed nationality).
  validates_uniqueness_of :wca_id, if: -> { new_record? && subId == 1 }, case_sensitive: true
  validates_format_of :wca_id, with: User::WCA_ID_RE

  # After checking with the WRT there are still missing dob in the db.
  # Therefore we'll enforce dob validation only for new records.
  # If we absolutely need to add a person for which we don't know the dob,
  # a workaround to this validation would be to create them with any dob,
  # then fix them to a blank dob.
  validate :dob_must_be_valid
  private def dob_must_be_valid
    if new_record? && !dob
      errors.add(:dob, I18n.t('errors.messages.invalid'))
    end
  end

  validate :dob_must_be_in_the_past
  private def dob_must_be_in_the_past
    if dob && dob >= Date.today
      errors.add(:dob, I18n.t('users.errors.dob_past'))
    end
  end

  # If someone represented country A, and now represents country B, it's
  # easy to tell which solves are which (results have a countryId).
  # Fixing their country (B) to a new country C is easy to undo, just change
  # all Cs to Bs. However, if someone accidentally fixes their country from B
  # to A, then we cannot go back, as all their results are now for country A.
  validate :cannot_change_country_to_country_represented_before
  private def cannot_change_country_to_country_represented_before
    if countryId_changed? && !new_record? && !@updating_using_sub_id
      has_represented_this_country_already = Person.exists?(wca_id: wca_id, countryId: countryId)
      if has_represented_this_country_already
        errors.add(:countryId, I18n.t('users.errors.already_represented_country'))
      end
    end
  end

  # This is necessary because we use a view instead of a real table.
  # Using `select` statement with `id` column causes MySQL to set a default value of 0,
  # so creating a Person returns the new record with id = 0, making the record reference 'died'.
  # The workaround is to set id attribute to nil before the object is created and let Rails reload it after creation.
  # For reference: https://github.com/rails/rails/issues/5982
  before_create -> { self.id = nil }

  after_update :update_results_table_and_associated_user
  private def update_results_table_and_associated_user
    unless @updating_using_sub_id
      results_for_most_recent_sub_id = results.where(personName: name_before_last_save, countryId: countryId_before_last_save)
      results_for_most_recent_sub_id.update_all(personName: name, countryId: countryId) if saved_change_to_name? || saved_change_to_countryId?
    end
    user.save! if user # User copies data from the person before validation, so this will update him.
  end

  def update_using_sub_id!(attributes)
    raise unless update_using_sub_id(attributes)
  end

  # Update the person attributes and save the old state as a new Person with greater subId.
  def update_using_sub_id(attributes)
    attributes = attributes.to_h
    @updating_using_sub_id = true
    if attributes.slice(:name, :countryId).all? { |k, v| v.nil? || v == self.send(k) }
      errors.add(:base, message: I18n.t('users.errors.must_have_a_change'))
      return false
    end
    old_attributes = self.attributes
    if update(attributes)
      Person.where(wca_id: wca_id).where.not(subId: 1).order(subId: :desc).update_all("subId = subId + 1")
      Person.create(old_attributes.merge!(subId: 2))
      true
    end
  ensure
    @updating_using_sub_id = false
  end

  # Note this is very similar to the cannot_register_for_competition_reasons method in user.rb.
  def cannot_be_assigned_to_user_reasons
    dob_form_path = Rails.application.routes.url_helpers.contact_dob_path
    [].tap do |reasons|
      reasons << I18n.t('users.errors.wca_id_no_name_html').html_safe if name.blank?
      reasons << I18n.t('users.errors.wca_id_no_gender_html').html_safe if gender.blank?
      reasons << I18n.t('users.errors.wca_id_no_birthdate_html', dob_form_path: dob_form_path).html_safe if dob.blank?
      reasons << I18n.t('users.errors.wca_id_no_citizenship_html').html_safe if country_iso2.blank?
    end
  end

  def likely_delegates
    all_delegates = competitions.order(:start_date).map(&:staff_delegates).flatten.select(&:any_kind_of_delegate?)
    if all_delegates.empty?
      return []
    end

    counts_by_delegate = all_delegates.each_with_object(Hash.new(0)) { |d, counts| counts[d] += 1 }
    most_frequent_delegate, _count = counts_by_delegate.max_by { |delegate, count| count }
    most_recent_delegate = all_delegates.last

    [most_frequent_delegate, most_recent_delegate].uniq
  end

  def wca_person
    self
  end

  def sub_ids
    Person.where(wca_id: wca_id).map(&:subId)
  end

  def country
    Country.c_find(countryId)
  end

  def country_iso2
    country&.iso2
  end

  private def rank_for_event_type(event, type)
    case type
    when :single
      ranksSingle.find_by_eventId(event.id)
    when :average
      ranksAverage.find_by_eventId(event.id)
    else
      raise "Unrecognized type #{type}"
    end
  end

  def world_rank(event, type)
    rank = rank_for_event_type(event, type)
    rank ? rank.worldRank : nil
  end

  def best_solve(event, type)
    rank = rank_for_event_type(event, type)
    SolveTime.new(event.id, type, rank ? rank.best : 0)
  end

  def world_championship_podiums
    results.podium
           .joins(:event, competition: [:championships])
           .where("championships.championship_type = 'world'")
           .order("YEAR(start_date) DESC, Events.rank")
           .includes(:competition, :format)
  end

  def championship_podiums_with_condition
    # Get all championship competitions of the given type where the person made it to the finals.
    # For each of these competitions, get final results only for people eligible for the championship
    # and reassign their positions. If a result belongs to the person, add it to the array.
    [].tap do |championship_podium_results|
      yield(results)
        .final
        .succeeded
        .order("YEAR(start_date) DESC")
        .includes(:competition)
        .map(&:competition)
        .uniq
        .each do |competition|
          yield(competition.results)
            .final
            .succeeded
            .joins(:event)
            .order("Events.rank, pos")
            .includes(:format, :competition)
            .group_by(&:eventId)
            .each_value do |final_results|
              previous_old_pos = nil
              previous_new_pos = nil
              final_results.each_with_index do |result, index|
                old_pos = result.pos
                result.pos = (result.pos == previous_old_pos ? previous_new_pos : index + 1)
                previous_old_pos = old_pos
                previous_new_pos = result.pos
                break if result.pos > 3
                championship_podium_results.push result if result.personId == self.wca_id
              end
            end
        end
    end
  end

  def championship_podiums
    {}.tap do |podiums|
      podiums[:world] = world_championship_podiums
      podiums[:continental] = championship_podiums_with_condition do |results|
        results.joins(:country, competition: [:championships]).where("championships.championship_type = countries.continent_id")
      end
      EligibleCountryIso2ForChampionship.championship_types.each do |championship_type|
        podiums[championship_type.to_sym] = championship_podiums_with_condition do |results|
          results
            .joins(:country, competition: { championships: :eligible_country_iso2s_for_championship })
            .where("eligible_country_iso2s_for_championship.championship_type = ?", championship_type)
            .where("eligible_country_iso2s_for_championship.eligible_country_iso2 = countries.iso2")
        end
      end
      podiums[:national] = championship_podiums_with_condition do |results|
        results.joins(:country, competition: [:championships]).where("championships.championship_type = countries.iso2")
      end
    end
  end

  def medals
    positions = results.podium.pluck(:pos)
    {
      gold: positions.count(1),
      silver: positions.count(2),
      bronze: positions.count(3),
      total: positions.count,
    }
  end

  def records
    records = results.pluck(:regionalSingleRecord, :regionalAverageRecord).flatten.select(&:present?)
    {
      national: records.count("NR"),
      continental: records.reject { |record| %w(NR WR).include?(record) }.count,
      world: records.count("WR"),
      total: records.count,
    }
  end

  def completed_solves_count
    results.pluck("value1, value2, value3, value4, value5").flatten.count { |value| value > 0 }
  end

  def gender_visible?
    %w(m f).include? gender
  end

  def self.search(query)
    persons = Person.current.includes(:user)
    query.split.each do |part|
      persons = persons.where("name LIKE :part OR wca_id LIKE :part", part: "%#{part}%")
    end
    persons.order(:name)
  end

  def url
    Rails.application.routes.url_helpers.person_url(wca_id, host: EnvVars.ROOT_URL)
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: ["wca_id", "name", "gender"],
    methods: ["url", "country_iso2"],
  }.freeze

  def serializable_hash(options = nil)
    json = super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
    json.merge!(
      class: self.class.to_s.downcase,
      id: self.wca_id,
    )

    # If there's a user for this Person, merge in all their data,
    # the Person's data takes priority, though.
    (user || User.new).serializable_hash(options).merge(json)
  end
end
