# frozen_string_literal: true

class Person < ApplicationRecord
  self.table_name = "rails_persons"
  self.primary_key = "id"

  has_one :user, primary_key: "wca_id", foreign_key: "wca_id"
  has_many :results, primary_key: "wca_id", foreign_key: "personId"
  has_many :competitions, -> { distinct }, through: :results
  has_many :ranksAverage, primary_key: "wca_id", foreign_key: "personId", class_name: "RanksAverage"
  has_many :ranksSingle, primary_key: "wca_id", foreign_key: "personId", class_name: "RanksSingle"

  enum gender: (User::ALLOWABLE_GENDERS.map { |g| [g, g.to_s] }.to_h)

  scope :current, -> { where(subId: 1) }

  scope :in_region, lambda { |region_id|
    unless region_id.blank? || region_id == 'all'
      where(countryId: (Continent.country_ids(region_id) || region_id))
    end
  }

  validates :name, presence: true
  validates :countryId, presence: true

  before_validation :unpack_dob
  private def unpack_dob
    if @dob.nil? && !dob.blank?
      @dob = dob.strftime("%F")
    end
    if @dob.blank?
      self.year = self.month = self.day = 0
    else
      unless @dob =~ /\A\d{4}-\d{2}-\d{2}\z/
        errors.add(:dob, "is invalid")
        return false
      end
      self.year, self.month, self.day = @dob.split("-").map(&:to_i)
      unless Date.valid_date? self.year, self.month, self.day
        errors.add(:dob, "is invalid")
        return false
      end
    end
  end

  validate :dob_must_be_in_the_past
  private def dob_must_be_in_the_past
    if dob && dob >= Date.today
      errors.add(:dob, "must be in the past")
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
        errors.add(:countryId, "Cannot change the country to a country the person has already represented in the past.")
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
      results.where(personName: name_was).update_all(personName: name) if name_changed?
      results.where(countryId: countryId_was).update_all(countryId: countryId) if countryId_changed?
    end
    user.save! if user # User copies data from the person before validation, so this will update him.
  end

  # Keep the information since admin_controller needs it.
  attr_reader :country_id_changed
  after_update -> { @country_id_changed = countryId_changed? }

  def update_using_sub_id!(attributes)
    raise unless update_using_sub_id(attributes)
  end

  # Update the person attributes and save the old state as a new Person with greater subId.
  def update_using_sub_id(attributes)
    if attributes.slice(:name, :countryId).all? { |k, v| v.nil? || v == self.send(k) }
      errors[:base] << "The name or the country must be different to update the person."
      return false
    end
    old_attributes = self.attributes
    @updating_using_sub_id = true
    if update_attributes(attributes)
      Person.where(wca_id: wca_id).where.not(subId: 1).order(subId: :desc).update_all("subId = subId + 1")
      Person.create(old_attributes.merge!(subId: 2))
      return true
    end
  end

  # Note this is very similar to the cannot_register_for_competition_reasons method in user.rb.
  def cannot_be_assigned_to_user_reasons
    dob_form_path = Rails.application.routes.url_helpers.contact_dob_path
    [].tap do |reasons|
      reasons << I18n.t('users.errors.wca_id_no_name_html') if name.blank?
      reasons << I18n.t('users.errors.wca_id_no_gender_html') if gender.blank?
      reasons << I18n.t('users.errors.wca_id_no_birthdate_html', dob_form_path: dob_form_path) if dob.blank?
      reasons << I18n.t('users.errors.wca_id_no_citizenship_html') if country_iso2.blank?
    end
  end

  def likely_delegates
    all_delegates = competitions.order(:year, :month, :day).map(&:delegates).flatten.select(&:any_kind_of_delegate?)
    if all_delegates.empty?
      return []
    end

    counts_by_delegate = all_delegates.each_with_object(Hash.new(0)) { |d, counts| counts[d] += 1 }
    most_frequent_delegate, _count = counts_by_delegate.max_by { |delegate, count| count }
    most_recent_delegate = all_delegates.last

    [most_frequent_delegate, most_recent_delegate].uniq
  end

  def sub_ids
    Person.where(wca_id: wca_id).map(&:subId)
  end

  attr_writer :dob

  def dob
    year == 0 || month == 0 || day == 0 ? nil : Date.new(year, month, day)
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
    results.includes(:competition, :event, :format)
           .podium
           .where("Competitions.cellName LIKE 'World Championship %'")
           .order("year DESC, Events.rank")
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

  def serializable_hash(options = nil)
    json = {
      class: self.class.to_s.downcase,
      url: Rails.application.routes.url_helpers.person_path(self.wca_id),

      id: self.wca_id,
      wca_id: self.wca_id,
      name: self.name,

      gender: self.gender,
      country_iso2: self.country_iso2,
    }

    # If there's a user for this Person, merge in all their data,
    # the Person's data takes priority, though.
    (user || User.new).serializable_hash.merge(json)
  end
end
