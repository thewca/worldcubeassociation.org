# frozen_string_literal: true

class Person < ApplicationRecord
  self.table_name = "Persons"

  has_one :user, primary_key: "wca_id", foreign_key: "wca_id"
  has_many :results, primary_key: "wca_id", foreign_key: "personId"
  has_many :competitions, -> { distinct }, through: :results
  has_many :ranks_average, primary_key: "wca_id", class_name: "RanksAverage"
  has_many :ranks_single, primary_key: "wca_id", class_name: "RanksSingle"

  enum :gender, User::ALLOWABLE_GENDERS.index_with(&:to_s)

  alias_attribute :ref_id, :wca_id

  scope :current, -> { where(subId: 1) }

  scope :in_region, lambda { |region_id|
    where(countryId: Continent.country_ids(region_id) || region_id) unless region_id.blank? || region_id == 'all'
  }

  validates :name, presence: true
  validates :countryId, inclusion: { in: Country::WCA_COUNTRY_IDS }

  # If creating a brand new person (ie: with subId equal to 1), then the
  # WCA ID must be unique.
  # Note: in general WCA ID are not unique in the table, as one person with
  # the same WCA ID may have multiple subIds (eg: if they changed nationality).
  validates :wca_id, uniqueness: { if: -> { new_record? && subId == 1 }, case_sensitive: true }
  validates :wca_id, format: { with: User::WCA_ID_RE }

  # After checking with the WRT there are still missing dob in the db.
  # Therefore we'll enforce dob validation only for new records.
  # If we absolutely need to add a person for which we don't know the dob,
  # a workaround to this validation would be to create them with any dob,
  # then fix them to a blank dob.
  validate :dob_must_be_valid
  private def dob_must_be_valid
    errors.add(:dob, I18n.t('errors.messages.invalid')) if new_record? && !dob
  end

  validate :dob_must_be_in_the_past
  private def dob_must_be_in_the_past
    errors.add(:dob, I18n.t('users.errors.dob_past')) if dob && dob >= Date.today
  end

  # If someone represented country A, and now represents country B, it's
  # easy to tell which solves are which (results have a countryId).
  # Fixing their country (B) to a new country C is easy to undo, just change
  # all Cs to Bs. However, if someone accidentally fixes their country from B
  # to A, then we cannot go back, as all their results are now for country A.
  validate :cannot_change_country_to_country_represented_before
  private def cannot_change_country_to_country_represented_before
    return unless countryId_changed? && !new_record? && !@updating_using_sub_id

    has_represented_this_country_already = Person.exists?(wca_id: wca_id, countryId: countryId)
    errors.add(:countryId, I18n.t('users.errors.already_represented_country')) if has_represented_this_country_already
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
    wrt_contact_path = Rails.application.routes.url_helpers.contact_path(contactRecipient: 'wrt')
    [].tap do |reasons|
      reasons << I18n.t('users.errors.wca_id_no_name_html', wrt_contact_path: wrt_contact_path).html_safe if name.blank?
      reasons << I18n.t('users.errors.wca_id_no_gender_html', wrt_contact_path: wrt_contact_path).html_safe if gender.blank?
      reasons << I18n.t('users.errors.wca_id_no_birthdate_html', dob_form_path: dob_form_path).html_safe if dob.blank?
      reasons << I18n.t('users.errors.wca_id_no_citizenship_html', wrt_contact_path: wrt_contact_path).html_safe if country_iso2.blank?
    end
  end

  def likely_delegates
    all_delegates = competitions.order(:start_date).flat_map(&:staff_delegates).select(&:any_kind_of_delegate?)
    return [] if all_delegates.empty?

    counts_by_delegate = all_delegates.group_by(&:itself).transform_values(&:count)
    most_frequent_delegate, _count = counts_by_delegate.max_by { |_delegate, count| count }
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
      ranks_single.find_by(eventId: event.id)
    when :average
      ranks_average.find_by(eventId: event.id)
    else
      raise "Unrecognized type #{type}"
    end
  end

  def world_rank(event, type)
    rank = rank_for_event_type(event, type)
    rank&.world_rank
  end

  def best_solve(event, type)
    rank = rank_for_event_type(event, type)
    SolveTime.new(event.id, type, rank ? rank.best : 0)
  end

  def world_championship_podiums
    results.podium
           .joins(:event, competition: [:championships])
           .where("championships.championship_type = 'world'")
           .order("YEAR(start_date) DESC, events.rank")
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
            .order("events.rank, pos")
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
      EligibleCountryIso2ForChampionship::CHAMPIONSHIP_TYPES.each do |championship_type|
        podiums[championship_type.to_sym] = championship_podiums_with_condition do |results|
          results
            .joins(:country, competition: { championships: :eligible_country_iso2s_for_championship })
            .where(eligible_country_iso2s_for_championship: { championship_type: championship_type })
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
    records = results.pluck(:regionalSingleRecord, :regionalAverageRecord).flatten.compact_blank
    {
      national: records.count("NR"),
      continental: records.count { |record| %w(NR WR).exclude?(record) },
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

  def self.search(query, params: {})
    persons = Person.current.includes(:user)
    query.split.each do |part|
      persons = persons.where("name LIKE :part OR wca_id LIKE :part", part: "%#{part}%")
    end
    persons.order(:name)
  end

  def url
    Rails.application.routes.url_helpers.person_url(wca_id, host: EnvConfig.ROOT_URL)
  end

  def self.fields_edit_requestable
    [:name, :country_iso2, :gender, :dob].freeze
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: ["wca_id", "name", "gender"],
    methods: ["url", "country_iso2"],
  }.freeze

  USER_COMMON_SERIALIZE_OPTIONS = {
    only: ["name", "gender"],
    methods: ["country_iso2"],
    # grrr… some tests (and apparently also API endpoints) rely on serializing this data _through_ person.
    #   Not a good code design decision, but very cumbersome to properly refactor. Signed GB 2025-01-09
    include: User::DEFAULT_SERIALIZE_OPTIONS[:include],
  }.freeze

  def personal_records
    [self.ranks_average, self.ranks_single].compact.flatten
  end

  def best_singles_by(target_date)
    self.results.on_or_before(target_date).succeeded.group(:eventId).minimum(:best)
  end

  def best_averages_by(target_date)
    self.results.on_or_before(target_date).average_succeeded.group(:eventId).minimum(:average)
  end

  def anonymization_checks_with_message_args
    recent_competitions_3_months = competitions&.select { |c| c.start_date > (Date.today - 3.months) }
    competitions_with_external_website = competitions&.select { |c| c.external_website.present? }

    [
      {
        person_has_records_in_past: records.present? && records[:total] > 0,
        person_held_championship_podiums: championship_podiums&.values_at(:world, :continental, :national)&.any?(&:present?),
        person_competed_in_last_3_months: recent_competitions_3_months&.any?,
        competitions_with_external_website: competitions_with_external_website&.any?,
        recent_competitions_data_to_be_removed_wca_live: recent_competitions_3_months&.any?,
      },
      {
        records: records,
        championship_podiums: championship_podiums,
        recent_competitions_3_months: recent_competitions_3_months,
        competitions_with_external_website: competitions_with_external_website,
      },
    ]
  end

  def anonymize
    wca_id_year = wca_id[0..3]
    semi_id, = FinishUnfinishedPersons.compute_semi_id(wca_id_year, User::ANONYMOUS_NAME)
    new_wca_id, = FinishUnfinishedPersons.complete_wca_id(semi_id)

    raise "Error generating new WCA ID" if new_wca_id.nil?

    # Anonymize data in Results
    results.update_all(personId: new_wca_id, personName: User::ANONYMOUS_NAME)

    # Anonymize sub-IDs
    if sub_ids.length > 1
      # if an updated person is due to a name change, this will delete the previous person.
      # if an updated person is due to a country change, this will keep the sub person with an appropriate subId
      previous_persons = Person.where(wca_id: wca_id).where.not(subId: 1).order(:subId)
      current_sub_id = 1
      current_country_id = countryId

      previous_persons.each do |p|
        if p.countryId == current_country_id
          p.delete
        else
          current_sub_id += 1
          current_country_id = p.countryId
          p.update(
            wca_id: new_wca_id,
            name: User::ANONYMOUS_NAME,
            gender: User::ANONYMOUS_GENDER,
            dob: User::ANONYMOUS_DOB,
            subId: current_sub_id,
          )
        end
      end
    end

    # Anonymize person's data in Persons for subid 1
    update!(
      wca_id: new_wca_id,
      name: User::ANONYMOUS_NAME,
      gender: User::ANONYMOUS_GENDER,
      dob: User::ANONYMOUS_DOB,
    )

    new_wca_id
  end

  def private_attributes_for_user(user)
    return [] if user.nil?

    if user.wca_id == wca_id || user.any_kind_of_delegate?
      %w[dob]
    elsif user.can_admin_results?
      %w[incorrect_wca_id_claim_count dob]
    else
      []
    end
  end

  def serializable_hash(options = nil)
    json = super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
    json[:class] = self.class.to_s.downcase
    json[:id] = self.wca_id

    private_attributes = options&.fetch(:private_attributes, []) || []
    json[:dob] = dob.to_s if private_attributes.include?("dob")

    json[:incorrect_wca_id_claim_count] = incorrect_wca_id_claim_count if private_attributes.include?("incorrect_wca_id_claim_count")

    # Passing down options from Person to User (which are completely different models in the DB!)
    #   is a horrible idea. Unfortunately, our external APIs have come to rely on it,
    #   so we need to hack around it.
    # First, we check whether the developer specifically gave instructions about which `user` properties they want.
    hash_include_specified = options&.dig(:include).is_a? Hash
    user_pass_down_options = hash_include_specified ? options&.dig(:include, :user) : options
    # Second, we need to apply some crazy merging logic:
    #   - `merge_union` makes sure that only values specified in USER_COMMON_SERIALIZE_OPTIONS kick in
    #   - `filter` makes sure that when the result of `merge_union` are empty, the defaults from
    #       User::DEFAULT_SERIALIZE_OPTIONS can override.
    #     However, if the developer explicitly specified that the `user` include should be empty, then respect that.
    user_override_options = USER_COMMON_SERIALIZE_OPTIONS.merge_serialization_opts(user_pass_down_options&.with_indifferent_access)
                                                         .filter { |_, v| hash_include_specified || v.present? }

    # If there's a user for this Person, merge in all their data,
    # the Person's data takes priority, though.
    (user || User.new).serializable_hash(user_override_options).merge(json)
  end
end
