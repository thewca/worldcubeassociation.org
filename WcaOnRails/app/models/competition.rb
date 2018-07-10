# frozen_string_literal: true

class Competition < ApplicationRecord
  self.table_name = "Competitions"

  has_many :competition_events, -> { order(:event_id) }, dependent: :destroy
  has_many :events, through: :competition_events
  has_many :registrations, dependent: :destroy
  has_many :results, foreign_key: "competitionId"
  has_many :scrambles, foreign_key: "competitionId"
  has_many :competitors, -> { distinct }, through: :results, source: :person
  has_many :competitor_users, -> { distinct }, through: :competitors, source: :user
  has_many :competition_delegates, dependent: :delete_all
  has_many :delegates, through: :competition_delegates
  has_many :competition_organizers, dependent: :delete_all
  has_many :organizers, through: :competition_organizers
  has_many :media, class_name: "CompetitionMedium", foreign_key: "competitionId", dependent: :delete_all
  has_many :tabs, -> { order(:display_order) }, dependent: :delete_all, class_name: "CompetitionTab"
  has_one :delegate_report, dependent: :destroy
  has_many :competition_venues, dependent: :destroy
  belongs_to :country, foreign_key: :countryId
  has_one :continent, foreign_key: :continentId, through: :country
  has_many :championships, dependent: :delete_all

  accepts_nested_attributes_for :competition_events, allow_destroy: true
  accepts_nested_attributes_for :championships, allow_destroy: true

  validates_numericality_of :base_entry_fee_lowest_denomination, greater_than_or_equal_to: 0, if: :entry_fee_required?
  monetize :base_entry_fee_lowest_denomination,
           as: "base_entry_fee",
           allow_nil: true,
           with_model_currency: :currency_code

  scope :visible, -> { where(showAtAll: true) }
  scope :over, -> { where("end_date < ?", Date.today) }
  scope :not_over, -> { where("end_date >= ?", Date.today) }
  scope :belongs_to_region, lambda { |region_id|
    joins(:country).where(
      "countryId = :region_id OR Countries.continentId = :region_id", region_id: region_id
    )
  }
  scope :contains, lambda { |search_term|
    where(
      "Competitions.name like :search_term or
      Competitions.cityName like :search_term",
      search_term: "%#{search_term}%",
    )
  }
  scope :has_event, lambda { |event_id|
    joins(
      "join competition_events ce#{event_id} ON ce#{event_id}.competition_id = Competitions.id
      join Events e#{event_id} ON e#{event_id}.id = ce#{event_id}.event_id",
    ).where("e#{event_id}.id = :event_id", event_id: event_id)
  }
  scope :managed_by, lambda { |user_id|
    joins("LEFT JOIN competition_organizers ON competition_organizers.competition_id = Competitions.id")
      .joins("LEFT JOIN competition_delegates ON competition_delegates.competition_id = Competitions.id")
      .where(
        "delegate_id = :user_id OR organizer_id = :user_id",
        user_id: user_id,
      ).group(:id)
  }
  scope :order_by_date, -> { order(:start_date, :end_date) }

  CLONEABLE_ATTRIBUTES = %w(
    cityName
    countryId
    information
    venue
    venueAddress
    venueDetails
    generate_website
    external_website
    latitude
    longitude
    contact
    remarks
    use_wca_registration
    competitor_limit_enabled
    competitor_limit
    competitor_limit_reason
    guests_enabled
    base_entry_fee_lowest_denomination
    currency_code
    enable_donations
    registration_requirements
  ).freeze
  UNCLONEABLE_ATTRIBUTES = %w(
    id
    start_date
    end_date
    name
    year
    month
    day
    endYear
    endMonth
    endDay
    cellName
    showAtAll
    isConfirmed
    registration_open
    registration_close
    results_posted_at
    results_nag_sent_at
    announced_at
    created_at
    updated_at
    connected_stripe_account_id
  ).freeze
  VALID_NAME_RE = /\A([-&.:' [:alnum:]]+) (\d{4})\z/
  PATTERN_LINK_RE = /\[\{([^}]+)}\{((https?:|mailto:)[^}]+)}\]/
  PATTERN_TEXT_WITH_LINKS_RE = /\A[^{}]*(#{PATTERN_LINK_RE.source}[^{}]*)*\z/
  MAX_ID_LENGTH = 32
  MAX_NAME_LENGTH = 50
  MAX_COMPETITOR_LIMIT = 5000
  validates_numericality_of :competitor_limit, greater_than_or_equal_to: 1, less_than_or_equal_to: MAX_COMPETITOR_LIMIT, if: :competitor_limit_enabled?
  validates :competitor_limit_reason, presence: true, if: :competitor_limit_enabled?
  validates :id, presence: true, uniqueness: true, length: { maximum: MAX_ID_LENGTH },
                 format: { with: /\A[a-zA-Z0-9]+\Z/ }, if: :name_valid_or_updating?
  private def name_valid_or_updating?
    self.persisted? || (name.length <= MAX_NAME_LENGTH && name =~ VALID_NAME_RE)
  end
  validates :name, length: { maximum: MAX_NAME_LENGTH },
                   format: { with: VALID_NAME_RE, message: proc { I18n.t('competitions.errors.invalid_name_message') } }
  MAX_CELL_NAME_LENGTH = 32
  validates :cellName, length: { maximum: MAX_CELL_NAME_LENGTH },
                       format: { with: VALID_NAME_RE, message: proc { I18n.t('competitions.errors.invalid_name_message') } }, if: :name_valid_or_updating?
  validates :venue, format: { with: PATTERN_TEXT_WITH_LINKS_RE }
  validates :external_website, format: { with: %r{\Ahttps?://.*\z} }, allow_blank: true

  validates :currency_code, inclusion: { in: Money::Currency, message: proc { I18n.t('competitions.errors.invalid_currency_code') } }

  NEARBY_DISTANCE_KM_WARNING = 250
  NEARBY_DISTANCE_KM_DANGER = 100
  NEARBY_DISTANCE_KM_INFO = 100
  NEARBY_DAYS_WARNING = 180
  NEARBY_DAYS_DANGER = 19
  NEARBY_DAYS_INFO = 365
  NEARBY_INFO_COUNT = 8
  RECENT_DAYS = 30
  REPORT_AND_RESULTS_DAYS_OK = 7
  REPORT_AND_RESULTS_DAYS_WARNING = 14
  REPORT_AND_RESULTS_DAYS_DANGER = 21
  ANNOUNCED_DAYS_WARNING = 21
  ANNOUNCED_DAYS_DANGER = 28
  MAX_SPAN_DAYS = 6

  # https://www.worldcubeassociation.org/regulations/guidelines.html#8a4++
  SHOULD_BE_ANNOUNCED_GTE_THIS_MANY_DAYS = 29

  # We have stricter validations for confirming a competition
  validates :cityName, :countryId, :venue, :venueAddress, :latitude, :longitude, :registration_requirements, presence: true, if: :confirmed_or_visible?
  validates :external_website, presence: true, if: -> { confirmed_or_visible? && !generate_website }

  validate :must_have_at_least_one_event, if: :confirmed_or_visible?
  private def must_have_at_least_one_event
    if no_events?
      errors.add(:competition_events, I18n.t('competitions.errors.must_contain_event'))
    end
  end

  def number_of_days
    (end_date - start_date).to_i + 1
  end

  def start_time
    # Take the easternmost offset
    start_date.to_datetime.change(offset: "+1400")
  end

  def end_time
    # Take the westernmost offset
    (end_date + 1).to_datetime.change(offset: "-1200")
  end

  def with_old_id
    new_id = self.id
    self.id = id_was
    yield
  ensure
    self.id = new_id
  end

  def no_events?
    with_old_id do
      competition_events.reject(&:marked_for_destruction?).empty?
    end
  end

  validate :must_have_at_least_one_delegate, if: :confirmed_or_visible?
  def must_have_at_least_one_delegate
    if delegate_ids.empty?
      errors.add(:delegate_ids, I18n.t('competitions.errors.must_contain_delegate'))
    end
  end

  def confirmed_or_visible?
    self.isConfirmed || self.showAtAll
  end

  def country
    Country.c_find(self.countryId)
  end

  # Enforce that the users marked as delegates for this competition are
  # actually delegates. Note: just because someone (legally) delegated a
  # competition in the past does not mean that they are still a delegate,
  # so we do not enforce this validation for past competitions.
  # See https://github.com/thewca/worldcubeassociation.org/issues/185#issuecomment-168402252
  # for a discussion about tracking delegate history so we could tighten up
  # this validation.
  validate :delegates_must_be_delegates, unless: :is_probably_over?
  def delegates_must_be_delegates
    if !self.delegates.all?(&:any_kind_of_delegate?)
      errors.add(:delegate_ids, I18n.t('competitions.errors.not_all_delegates'))
    end
  end

  def user_should_post_delegate_report?(user)
    persisted? && is_probably_over? && !delegate_report.posted? && delegates.include?(user)
  end

  def user_should_post_competition_results?(user)
    persisted? && is_probably_over? && !self.results_posted? && delegates.include?(user)
  end

  def warnings_for(user)
    warnings = {}
    if !self.showAtAll
      warnings[:invisible] = I18n.t('competitions.messages.not_visible')

      if self.name.length > 32
        warnings[:name] = I18n.t('competitions.messages.name_too_long')
      end

      if no_events?
        warnings[:events] = I18n.t('competitions.messages.must_have_events')
      end
    end

    warnings
  end

  def info_for(user)
    info = {}
    if !self.results_posted? && self.is_probably_over?
      info[:upload_results] = I18n.t('competitions.messages.upload_results')
    end
    if self.in_progress?
      info[:in_progress] = I18n.t('competitions.messages.in_progress', date: I18n.l(self.end_date, format: :long))
    end
    info
  end

  attr_accessor :being_cloned_from_id
  def being_cloned_from
    Competition.find_by(id: being_cloned_from_id)
  end

  def build_clone
    Competition.new(attributes.slice(*CLONEABLE_ATTRIBUTES)).tap do |clone|
      clone.being_cloned_from_id = id

      Competition.reflections.each_key do |association_name|
        case association_name
        when 'registrations',
             'results',
             'competitors',
             'competitor_users',
             'delegate_report',
             'competition_delegates',
             'competition_events',
             'competition_organizers',
             'competition_venues',
             'media',
             'scrambles',
             'country',
             'continent',
             'championships'
          # Do nothing as they shouldn't be cloned.
        when 'organizers'
          clone.organizers = organizers
        when 'delegates'
          clone.delegates = delegates
        when 'events'
          clone.events = events
        when 'tabs'
          # Clone tabs in the clone_associations callback after the competition is saved.
          clone.clone_tabs = true
        else
          raise "Cloning behavior for Competition.#{association_name} is not defined. See Competition#build_clone."
        end
      end
    end
  end

  attr_accessor :clone_tabs

  # After the cloned competition is created, clone other associations which cannot just be copied.
  after_create :clone_associations
  private def clone_associations
    # Clone competition tabs.
    if clone_tabs
      being_cloned_from&.tabs&.each do |tab|
        tabs.create(tab.attributes.slice(*CompetitionTab::CLONEABLE_ATTRIBUTES))
      end
    end
  end

  after_create :create_delegate_report!

  before_validation :unpack_dates
  validate :dates_must_be_valid

  alias_attribute :latitude_microdegrees, :latitude
  alias_attribute :longitude_microdegrees, :longitude
  before_validation :compute_coordinates

  before_validation :create_id_and_cell_name
  def create_id_and_cell_name
    m = VALID_NAME_RE.match(name)
    if m
      name_without_year = m[1]
      year = m[2]
      if id.blank?
        # Generate competition id from name
        # By replacing accented chars with their ascii equivalents, and then
        # removing everything that isn't a digit or a character.
        safe_name_without_year = ActiveSupport::Inflector.transliterate(name_without_year).gsub(/[^a-z0-9]+/i, '')
        self.id = safe_name_without_year[0...(MAX_ID_LENGTH - year.length)] + year
      end
      if cellName.blank?
        year = " " + year
        self.cellName = name_without_year.truncate(MAX_CELL_NAME_LENGTH - year.length) + year
      end
    end
  end

  attr_writer :delegate_ids, :organizer_ids
  def delegate_ids
    @delegate_ids || delegates.map(&:id).join(",")
  end

  def organizer_ids
    @organizer_ids || organizers.map(&:id).join(",")
  end

  before_validation :unpack_delegate_organizer_ids
  def unpack_delegate_organizer_ids
    # This is a mess. When changing competition ids, the calls to delegates=
    # and organizers= below will cause database writes with a new competition_id.
    # We hack around this by pretending our id actually didn't change, and then
    # we restore it at the end. This means we'll preseve our existing
    # CompetitionOrganizer and CompetitionDelegate rows rather than creating new ones.
    # We'll fix their competition_id below in update_foreign_keys.
    with_old_id do
      if @delegate_ids
        self.delegates = @delegate_ids.split(",").map { |id| User.find(id) }
      end
      if @organizer_ids
        self.organizers = @organizer_ids.split(",").map { |id| User.find(id) }
      end
    end
  end

  old_competition_events_attributes = instance_method(:competition_events_attributes=)
  define_method(:competition_events_attributes=) do |attributes|
    # This is also a mess. We "overload" the competition_events_attributes= method
    # so it won't be confused by the fact that our competition's id is changing.
    # See similar hack and comment in unpack_delegate_organizer_ids.
    with_old_id do
      old_competition_events_attributes.bind(self).call(attributes)
    end
  end

  # Workaround for PHP code that requires these tables to be clean.
  # Once we're in all railsland, this can go, and we can add a script
  # that checks our database sanity instead.
  after_save :remove_non_existent_organizers_and_delegates
  def remove_non_existent_organizers_and_delegates
    CompetitionOrganizer.where(competition_id: id).where.not(organizer_id: organizers.map(&:id)).delete_all
    CompetitionDelegate.where(competition_id: id).where.not(delegate_id: delegates.map(&:id)).delete_all
  end

  def delegate_report
    with_old_id do
      DelegateReport.find_by_competition_id(id)
    end
  end

  # This callback updates all tables having the competition id, when the id changes.
  # This should be deleted after competition id is made immutable: https://github.com/thewca/worldcubeassociation.org/pull/381
  after_save :update_foreign_keys, if: :saved_change_to_id?
  def update_foreign_keys
    Competition.reflect_on_all_associations.uniq(&:klass).each do |association_reflection|
      foreign_key = association_reflection.foreign_key
      if ["competition_id", "competitionId"].include?(foreign_key)
        association_reflection.klass.where(foreign_key => id_before_last_save).update_all(foreign_key => id)
      end
    end
  end

  attr_accessor :editing_user_id
  validate :user_cannot_demote_themself
  def user_cannot_demote_themself
    if editing_user_id
      editing_user = User.find(editing_user_id)
      unless editing_user.can_manage_competition?(self)
        errors.add(:delegate_ids, "You cannot demote yourself")
        errors.add(:organizer_ids, "You cannot demote yourself")
      end
    end
  end

  validate :registration_must_close_after_it_opens
  def registration_must_close_after_it_opens
    if use_wca_registration?
      if !registration_open
        errors.add(:registration_open, I18n.t('simple_form.required.text'))
      end
      if !registration_close
        errors.add(:registration_close, I18n.t('simple_form.required.text'))
      end
      if registration_open && registration_close && !(registration_open < registration_close)
        errors.add(:registration_close, I18n.t('competitions.errors.registration_close_after_open'))
      end
    end
  end

  attr_reader :receive_registration_emails
  def receive_registration_emails=(r)
    @receive_registration_emails = ActiveRecord::Type::Boolean.new.cast(r)
  end

  after_save :clear_external_website, if: :generate_website?
  private def clear_external_website
    update_column :external_website, nil
  end

  def website
    generate_website ? internal_website : external_website
  end

  def internal_website
    Rails.application.routes.url_helpers.competition_url(self, host: ENVied.ROOT_URL)
  end

  def managers
    (organizers + delegates).uniq
  end

  def receiving_registration_emails?(user_id)
    competition_delegate = competition_delegates.find_by_delegate_id(user_id)
    if competition_delegate&.receive_registration_emails
      return true
    end
    competition_organizer = competition_organizers.find_by_organizer_id(user_id)
    if competition_organizer&.receive_registration_emails
      return true
    end

    false
  end

  def can_receive_registration_emails?(user_id)
    competition_delegate = competition_delegates.find_by_delegate_id(user_id)
    if competition_delegate
      return true
    end
    competition_organizer = competition_organizers.find_by_organizer_id(user_id)
    if competition_organizer
      return true
    end

    false
  end

  after_save :update_receive_registration_emails
  def update_receive_registration_emails
    if editing_user_id && !@receive_registration_emails.nil?
      competition_delegate = competition_delegates.find_by_delegate_id(editing_user_id)
      if competition_delegate
        competition_delegate.update_attribute(:receive_registration_emails, @receive_registration_emails)
      end
      competition_organizer = competition_organizers.find_by_organizer_id(editing_user_id)
      if competition_organizer
        competition_organizer.update_attribute(:receive_registration_emails, @receive_registration_emails)
      end
    end
  end

  def using_stripe_payments?
    connected_stripe_account_id && has_fees?
  end

  def can_edit_registration_fees?
    # Quick workaround for https://github.com/thewca/worldcubeassociation.org/issues/2123
    # (We used to return `registrations.with_payments.empty?` here)
    true
  end

  def registration_opened?
    use_wca_registration? && !registration_not_yet_opened? && !registration_past?
  end

  def registration_not_yet_opened?
    registration_open && Time.now < registration_open
  end

  def registration_past?
    registration_close && registration_close < Time.now
  end

  def longitude_degrees
    longitude_microdegrees ? longitude_microdegrees / 1e6 : nil
  end

  def longitude_degrees=(new_longitude_degrees)
    @longitude_degrees = new_longitude_degrees.to_f
  end

  def longitude_radians
    to_radians longitude_degrees
  end

  def latitude_degrees
    latitude_microdegrees ? latitude_microdegrees / 1e6 : nil
  end

  def latitude_degrees=(new_latitude_degrees)
    @latitude_degrees = new_latitude_degrees.to_f
  end

  def latitude_radians
    to_radians latitude_degrees
  end

  def country_zones
    ActiveSupport::TimeZone.country_zones(country.iso2).map { |tz| [tz.name, tz.tzinfo.name] }.to_h
  rescue TZInfo::InvalidCountryCode
    # This can occur for non real country *and* XK!
    # FIXME what to provide for XA, XE, XM, XS?
    {
      "London" => "Europe/London",
    }
  end

  private def compute_coordinates
    unless @latitude_degrees.nil?
      self.latitude_microdegrees = @latitude_degrees * 1e6
    end
    unless @longitude_degrees.nil?
      self.longitude_microdegrees = @longitude_degrees * 1e6
    end
  end

  def has_events_with_ids?(event_ids)
    (event_ids - events.ids).empty?
  end

  def has_event?(event)
    self.events.include?(event)
  end

  def has_base_entry_fee?
    base_entry_fee.nonzero?
  end

  def has_fees?
    if base_entry_fee_lowest_denomination.nil?
      competition_events.sum(:fee_lowest_denomination) > 0
    else
      base_entry_fee_lowest_denomination + competition_events.sum(:fee_lowest_denomination) > 0
    end
  end

  def entry_fee_required?
    isConfirmed? && created_at.present? && created_at > Date.new(2018, 7, 17)
  end

  def competitor_limit_enabled?
    competitor_limit_enabled
  end

  def pending_results_or_report(days)
    self.end_date < (Date.today - days) && (self.delegate_report.posted_at.nil? || results_posted_at.nil?)
  end

  private def unpack_dates
    if start_date
      self.year = start_date.year
      self.month = start_date.month
      self.day = start_date.day
    else
      self.year = self.month = self.day = 0
    end

    if end_date
      self.endYear = end_date.year
      self.endMonth = end_date.month
      self.endDay = end_date.day
    else
      self.endYear = self.endMonth = self.endDay = 0
    end
  end

  private def dates_must_be_valid
    if start_date.nil? && end_date.nil?
      if confirmed_or_visible?
        errors.add(:start_date, I18n.t('common.errors.invalid'))
        errors.add(:end_date, I18n.t('common.errors.invalid'))
      end
      return
    end

    return errors.add(:start_date, I18n.t('common.errors.invalid')) unless start_date.present?
    return errors.add(:end_date, I18n.t('common.errors.invalid')) unless end_date.present?

    if end_date < start_date
      errors.add(:end_date, I18n.t('competitions.errors.end_date_before_start'))
    end

    if (end_date - start_date).to_i > MAX_SPAN_DAYS
      errors.add(:end_date, I18n.t('competitions.errors.span_too_many_days', max_days: MAX_SPAN_DAYS))
    end
  end

  # Since Competition.events only includes saved events
  # this method is required to ensure that in any forms which
  # select events, unsaved events are still presented if
  # there are any validation issues on the form.
  def saved_and_unsaved_events
    competition_events.reject(&:marked_for_destruction?).map(&:event)
  end

  def nearby_competitions(days, distance)
    Competition.where("ABS(DATEDIFF(?, start_date)) <= ? AND id <> ?", start_date, days, id)
               .select { |c| kilometers_to(c) <= distance }
               .sort_by { |c| kilometers_to(c) }
  end

  private def to_radians(degrees)
    degrees * Math::PI / 180
  end

  # Source http://www.movable-type.co.uk/scripts/latlong.html
  def kilometers_to(c)
    6371 *
      Math.sqrt(
        ((c.longitude_radians - longitude_radians) * Math.cos((c.latitude_radians + latitude_radians)/2)) ** 2 +
        (c.latitude_radians - latitude_radians) ** 2,
      )
  end

  def has_date?
    start_date != nil
  end

  def has_location?
    latitude.present? && longitude.present?
  end

  def days_until
    start_date ? (start_date - Time.now.to_date).to_i : nil
  end

  def has_date_errors?
    valid?
    !errors[:start_date].empty? || !errors[:end_date].empty? || (!showAtAll && days_until && days_until < SHOULD_BE_ANNOUNCED_GTE_THIS_MANY_DAYS)
  end

  def dangerously_close_to?(c)
    if !c.start_date || !self.start_date
      return false
    end
    days_until = (c.start_date - self.start_date).to_i
    self.kilometers_to(c) < NEARBY_DISTANCE_KM_DANGER && days_until.abs < NEARBY_DAYS_DANGER
  end

  def results_posted?
    !results_posted_at.nil?
  end

  def user_can_view?(user)
    self.showAtAll || user&.can_manage_competition?(self)
  end

  def user_can_view_results?(user)
    results_posted? || (user&.can_admin_results? && !results.empty?)
  end

  def in_progress?
    !results_posted? && (start_date..end_date).cover?(Date.today)
  end

  # The name `is_probably_over` is meant to be surprising.
  # We don't actually know when competitions are over, because we don't know their schedules, nor
  # do we know their timezones.
  # See discussion here: https://github.com/thewca/worldcubeassociation.org/pull/1206/files#r98485399.
  def is_probably_over?
    !end_date.nil? && end_date < Date.today
  end

  def upcoming?
    !results_posted? && (start_date.nil? || start_date > Date.today)
  end

  def city_and_country
    [cityName, country&.name].compact.join(', ')
  end

  def result_cache_key(view)
    results_updated_at = results.order('updated_at desc').limit(1).pluck(:updated_at).first
    [id, view, results_updated_at&.iso8601 || "", I18n.locale]
  end

  def events_with_podium_results
    light_results_from_relation(
      results.podium.order(:pos),
    ).group_by(&:event)
      .sort_by { |event, _results| event.rank }
  end

  def winning_results
    light_results_from_relation(
      results.winners,
    )
  end

  def person_ids_with_results
    light_results_from_relation(results)
      .group_by(&:personId)
      .sort_by { |_personId, results| results.first.personName }
      .map do |personId, results|
        results.sort_by! { |r| [r.event.rank, -r.round_type.rank] }

        # Mute (soften) each result that wasn't the competitor's last for the event.
        last_event = nil
        results.each do |result|
          result.muted = (result.event == last_event)
          last_event = result.event
        end

        [personId, results.sort_by { |r| [r.event.rank, -r.round_type.rank] }]
      end
  end

  def events_with_round_types_with_results
    light_results_from_relation(results)
      .group_by(&:event)
      .sort_by { |event, _results| event.rank }
      .map do |event, results_for_event|
        round_types_with_results = results_for_event
                                   .group_by(&:round_type)
                                   .sort_by { |format, _results| format.rank }
                                   .map { |round_type, results| [round_type, results.sort_by { |r| [r.pos, r.personName] }] }

        [event, round_types_with_results]
      end
  end

  # Profiling the rendering of _results_table.html.erb showed quite some
  # time was spent in `ActiveRecord#read_attribute`. So, I load the results
  # using raw SQL and instantiate a PORO. The code definitely got uglier,
  # but the performance gains are worth it IMO. Not using ActiveRecord led
  # to a 40% performance improvement.
  private def light_results_from_relation(relation)
    ActiveRecord::Base.connection
                      .execute(relation.to_sql)
                      .each(as: :hash).map { |r|
                        LightResult.new(r, Country.c_find(r["countryId"]), Format.c_find(r["formatId"]), RoundType.c_find(r["roundTypeId"]), Event.c_find(r["eventId"]))
                      }
  end

  def started?
    start_date.present? && start_date < Date.today
  end

  def organizers_or_delegates
    self.organizers.empty? ? self.delegates : self.organizers
  end

  def psych_sheet_event(event, sort_by, sort_by_second)
    competition_event = competition_events.find_by!(event_id: event.id)
    joinsql = <<-SQL
      JOIN registration_competition_events ON registration_competition_events.registration_id = registrations.id
      JOIN users ON users.id = registrations.user_id
      JOIN Countries ON Countries.iso2 = users.country_iso2
      LEFT JOIN RanksSingle ON RanksSingle.personId = users.wca_id AND RanksSingle.eventId = '#{event.id}'
      LEFT JOIN RanksAverage ON RanksAverage.personId = users.wca_id AND RanksAverage.eventId = '#{event.id}'
    SQL

    selectsql = <<-SQL
      registrations.id,
      users.name select_name,
      users.wca_id select_wca_id,
      registrations.accepted_at,
      registrations.deleted_at,
      Countries.name select_country,
      registration_competition_events.competition_event_id,
      RanksAverage.worldRank average_rank,
      ifnull(RanksAverage.best, 0) average_best,
      RanksSingle.worldRank single_rank,
      ifnull(RanksSingle.best, 0) single_best
    SQL

    sort_clause = "-#{sort_by}_rank desc, -#{sort_by_second}_rank desc, users.name"

    registrations = self.registrations
                        .accepted
                        .joins(joinsql)
                        .where("registration_competition_events.competition_event_id=?", competition_event.id)
                        .order(sort_clause)
                        .select(selectsql)

    prev_registration = nil
    registrations.each_with_index do |registration, i|
      if sort_by == 'single'
        rank = registration.single_rank
        prev_rank = prev_registration&.single_rank
      else
        rank = registration.average_rank
        prev_rank = prev_registration&.average_rank
      end
      break if !rank # hasn't competed in this event yet and all subsequent registrations too
      registration.tied_previous = (rank == prev_rank)
      registration.pos = registration.tied_previous ? prev_registration.pos : i + 1
      prev_registration = registration
    end
    registrations
  end

  # For associated_events_picker
  def events_to_associated_events(events)
    events.map do |event|
      competition_events.find_by_event_id(event.id) || competition_events.build(event_id: event.id)
    end
  end

  def self.years
    Competition.where(showAtAll: true).pluck(:year).uniq.sort!.reverse!
  end

  def self.non_future_years
    self.years.select { |y| y <= Date.today.year }
  end

  def self.search(query, params: {}, managed_by_user: nil)
    if managed_by_user
      competitions = Competition.managed_by(managed_by_user.id)
    else
      competitions = Competition.visible
    end

    if params[:country_iso2].present?
      country = Country.find_by_iso2(params[:country_iso2])
      if !country
        raise WcaExceptions::BadApiParameter.new("Invalid country_iso2: '#{params[:country_iso2]}'")
      end
      competitions = competitions.where(countryId: country.id)
    end

    if params[:start].present?
      start_date = Date.safe_parse(params[:start])
      if !start_date
        raise WcaExceptions::BadApiParameter.new("Invalid start: '#{params[:start]}'")
      end
      competitions = competitions.where("start_date >= ?", start_date)
    end

    if params[:end].present?
      end_date = Date.safe_parse(params[:end])
      if !end_date
        raise WcaExceptions::BadApiParameter.new("Invalid end: '#{params[:end]}'")
      end
      competitions = competitions.where("end_date <= ?", end_date)
    end

    if params[:announced_after].present?
      announced_date = Date.safe_parse(params[:announced_after])
      if !announced_date
        raise WcaExceptions::BadApiParameter.new("Invalid announced date: '#{params[:announced_after]}'")
      end
      competitions = competitions.where("announced_at > ?", announced_date)
    end

    query&.split&.each do |part|
      like_query = %w(id name cellName cityName countryId).map { |column| column + " LIKE :part" }.join(" OR ")
      competitions = competitions.where(like_query, part: "%#{part}%")
    end

    competitions.includes(:delegates, :organizers).order(start_date: :desc)
  end

  # See https://github.com/thewca/worldcubeassociation.org/wiki/wcif
  def to_wcif
    {
      "formatVersion" => "1.0",
      "id" => id,
      "name" => name,
      "shortName" => cellName,
      "persons" => persons_wcif,
      "events" => events_wcif,
      "schedule" => schedule_wcif,
    }
  end

  def persons_wcif
    managers = self.managers
    includes_associations = [
      :events,
      user: {
        person: [:ranksSingle, :ranksAverage],
      },
    ]
    persons_wcif = registrations.order(:id).includes(includes_associations).map.with_index(1) do |r, registrant_id|
      managers.delete(r.user)
      r.user.to_wcif(self, r, registrant_id)
    end
    # Note: unregistered managers may generate N+1 queries on their personal bests,
    # but that's fine because there are very few of them!
    persons_wcif + managers.map { |m| m.to_wcif(self) }
  end

  def events_wcif
    competition_events.map(&:to_wcif)
  end

  def schedule_wcif
    {
      "startDate" => start_date.to_s,
      "numberOfDays" => number_of_days,
      "venues" => competition_venues.map(&:to_wcif),
    }
  end

  def set_wcif_events!(wcif_events, current_user)
    events_schema = { "type" => "array", "items" => CompetitionEvent.wcif_json_schema }
    JSON::Validator.validate!(events_schema, wcif_events)

    ActiveRecord::Base.transaction do
      # Remove extra events.
      self.competition_events.each do |competition_event|
        wcif_event = wcif_events.find { |e| e["id"] == competition_event.event.id }
        event_to_be_removed = !wcif_event || !wcif_event["rounds"]
        if event_to_be_removed
          raise WcaExceptions::BadApiParameter.new("Cannot remove events from a confirmed competition") unless current_user.can_add_and_remove_events?(self)
          competition_event.destroy!
        end
      end

      # Create missing events.
      wcif_events.each do |wcif_event|
        event_found = competition_events.find_by_event_id(wcif_event["id"])
        event_to_be_added = wcif_event["rounds"]
        if !event_found && event_to_be_added
          raise WcaExceptions::BadApiParameter.new("Cannot add events to a confirmed competition") unless current_user.can_add_and_remove_events?(self)
          competition_events.create!(event_id: wcif_event["id"])
        end
      end

      # Update all events.
      wcif_events.each do |wcif_event|
        event_to_be_added = wcif_event["rounds"]
        if event_to_be_added
          competition_events.find_by_event_id!(wcif_event["id"]).load_wcif!(wcif_event)
        end
      end
    end

    reload
  end

  # Takes an array of partial Person WCIF and updates the fields that are not immutable.
  def update_persons_wcif!(wcif_persons, current_user)
    persons_schema = { "type" => "array", "items" => User.wcif_json_schema }
    JSON::Validator.validate!(persons_schema, wcif_persons)

    ActiveRecord::Base.transaction do
      wcif_persons.each do |wcif_person|
        registration = registrations.find_by(user_id: wcif_person["wcaUserId"])
        # Note: person doesn't necessarily have corresponding registration (e.g. registratinless organizer/delegate).
        if registration && wcif_person["roles"]
          roles = wcif_person["roles"] - ["delegate", "organizer"] # These two are added on the fly.
          registration.update!(roles: roles)
        end
      end
    end
  end

  def set_wcif_schedule!(wcif_schedule, current_user)
    schedule_schema = {
      "type" => "object",
      "properties" => {
        "venues" => { "type" => "array", "items" => CompetitionVenue.wcif_json_schema },
        "startDate" => { "type" => "string" },
        "numberOfDays" => { "type" => "integer" },
      },
    }
    JSON::Validator.validate!(schedule_schema, wcif_schedule)

    if wcif_schedule["startDate"] != start_date.strftime("%F")
      raise WcaExceptions::BadApiParameter.new("Wrong start date for competition")
    elsif wcif_schedule["numberOfDays"] != number_of_days
      raise WcaExceptions::BadApiParameter.new("Wrong number of days for competition")
    end

    ActiveRecord::Base.transaction do
      new_venues = wcif_schedule["venues"].map do |venue_wcif|
        # using this find instead of ActiveRecord's find_or_create_by avoid several queries
        # (despite having the association included :()
        venue = competition_venues.find { |v| v.wcif_id == venue_wcif["id"] } || competition_venues.build
        venue.load_wcif!(venue_wcif)
      end
      self.competition_venues = new_venues
    end

    reload
  end

  def serializable_hash(options = nil)
    {
      class: self.class.to_s.downcase,
      url: Rails.application.routes.url_helpers.competition_url(self, host: ENVied.ROOT_URL),

      id: id,
      name: name,
      website: website,
      short_name: cellName,
      city: cityName,
      country_iso2: country&.iso2,
      start_date: start_date,
      announced_at: announced_at,
      end_date: end_date,
      delegates: delegates,
      organizers: organizers,
    }
  end
end
