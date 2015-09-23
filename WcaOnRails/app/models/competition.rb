class Competition < ActiveRecord::Base
  self.table_name = "Competitions"
  # FIXME Tests fail with "Unknown primary key for table Competitions in model Competition."
  #       when not setting the primary key explicitly. I have
  #       no clue why... (th, 2015-09-19)
  self.primary_key = "id"

  has_many :registrations, foreign_key: "competitionId"
  has_many :results, foreign_key: "competitionId"
  has_many :competition_delegates, dependent: :delete_all
  has_many :delegates, through: :competition_delegates
  has_many :competition_organizers, dependent: :delete_all
  has_many :organizers, through: :competition_organizers

  ENDS_WITH_YEAR_RE = /\A.* \d{4}\z/
  PATTERN_LINK_RE = /\[\{([^}]+)}\{((https?:|mailto:)[^}]+)}\]/
  PATTERN_TEXT_WITH_LINKS_RE = /\A[^{}]*(#{PATTERN_LINK_RE.source}[^{}]*)*\z/
  validates :id, presence: true, uniqueness: true, length: { maximum: 32 },
                 format: { with: /\A[a-zA-Z0-9]+\Z/ }
  validates :name, length: { maximum: 50 },
                   format: { with: ENDS_WITH_YEAR_RE }
  validates :cellName, length: { maximum: 45 },
                       format: { with: ENDS_WITH_YEAR_RE }
  validates :venue, format: { with: PATTERN_TEXT_WITH_LINKS_RE }
  validates :website, format: { with: PATTERN_TEXT_WITH_LINKS_RE }

  attr_writer :start_date, :end_date
  before_validation :unpack_dates
  validate :dates_must_be_valid
  validate :events_must_be_valid

  alias_attribute :latitude_microdegrees, :latitude
  alias_attribute :longitude_microdegrees, :longitude
  attr_accessor :longitude_degrees, :latitude_degrees
  before_validation :compute_coordinates

  before_validation :cleanup_event_specs
  def cleanup_event_specs
    self.eventSpecs ||= ""
  end

  before_validation :create_id_and_cell_name
  def create_id_and_cell_name
    if id.blank?
      # Generate competition id from name
      self.id = case_preserving_parametrize(name, "")
    end
    if cellName.blank?
      self.cellName = name
    end
  end
  # A copy of http://apidock.com/rails/ActiveSupport/Inflector/parameterize that
  # doesn't downcase everything at the end.
  def case_preserving_parametrize(string, sep='-')
    # replace accented chars with their ascii equivalents
    parameterized_string = ActiveSupport::Inflector.transliterate(string)
    # Turn unwanted chars into the separator
    parameterized_string.gsub!(/[^a-z0-9\-_]+/i, sep)
    unless sep.nil? || sep.empty?
      re_sep = Regexp.escape(sep)
      # No more than one of the separator in a row.
      parameterized_string.gsub!(/#{re_sep}{2,}/, sep)
      # Remove leading/trailing separator.
      parameterized_string.gsub!(/^#{re_sep}|#{re_sep}$/i, '')
    end
    parameterized_string
  end

  attr_accessor :competition_id_to_clone

  attr_writer :delegate_ids, :organizer_ids
  def delegate_ids
    @delegate_ids|| delegates.map(&:id).join(",")
  end
  def organizer_ids
    @organizer_ids || organizers.map(&:id).join(",")
  end
  before_validation :unpack_delegate_organizer_ids
  def unpack_delegate_organizer_ids
    def users_to_emails_str(users)
      users.sort_by(&:name).map { |user| "[{#{user.name}}{mailto:#{user.email}}]" }.join
    end
    if @delegate_ids
      self.delegates = @delegate_ids.split(",").map { |id| User.find(id) }
    end
    if @organizer_ids
      self.organizers = @organizer_ids.split(",").map { |id| User.find(id) }
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

  # This is kind of scary. Whenever a competition's id changes, We need to
  # remember all the places in our database that refer to competition ids, and
  # update them.. We can get rid of all this once we're done with
  # https://github.com/cubing/worldcubeassociation.org/issues/91.
  after_save :update_results_when_id_changes
  def update_results_when_id_changes
    if id_change
      Result.where(competitionId: id_was).update_all(competitionId: id)
      Registration.where(competitionId: id_was).update_all(competitionId: id)
      Scramble.where(competitionId: id_was).update_all(competitionId: id)
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

  def longitude_degrees
    longitude_microdegrees / 1e6
  end

  def longitude_degrees=(new_longitude_degrees)
    @longitude_degrees = new_longitude_degrees.to_f
  end

  def latitude_degrees
    latitude_microdegrees / 1e6
  end

  def latitude_degrees=(new_latitude_degrees)
    @latitude_degrees = new_latitude_degrees.to_f
  end

  private def compute_coordinates
    unless @latitude_degrees.nil?
      self.latitude_microdegrees = @latitude_degrees * 1e6
    end
    unless @longitude_degrees.nil?
      self.longitude_microdegrees = @longitude_degrees * 1e6
    end
  end

  def events
    # See https://github.com/cubing/worldcubeassociation.org/issues/95 for
    # what these equal signs are about.
    eventSpecs.split.map { |e| Event.find_by_id(e.split("=")[0]) }.sort_by &:rank
  end

  def start_date
    year == 0 || month == 0 || day == 0 ? nil : Date.parse("%04i-%02i-%02i" % [ year, month, day ])
  end

  def end_date
    endYear = @endYear || year # gross hack to remember the years of a multiyear competition
    endYear == 0 || endMonth == 0 || endDay == 0 ? nil : Date.parse("%04i-%02i-%02i" % [ endYear, endMonth, endDay ])
  end

  private def unpack_dates
    if @start_date.nil? && !start_date.blank?
      @start_date = start_date.strftime("%F")
    end
    if @start_date.blank?
      self.year = self.month = self.day = 0
    else
      self.year, self.month, self.day = @start_date.split("-").map(&:to_i)
    end
    if @end_date.nil? && !end_date.blank?
      @end_date = end_date.strftime("%F")
    end
    if @end_date.blank?
      @endYear = self.endMonth = self.endDay = 0
    else
      @endYear, self.endMonth, self.endDay = @end_date.split("-").map(&:to_i)
    end
  end

  private def dates_must_be_valid
    if self.year == 0 && self.month == 0 && self.day == 0 && @endYear == 0 && self.endMonth == 0 && self.endDay == 0
      # If the user left both dates empty, that's a-okay.
      return
    end

    valid_dates = true
    unless Date.valid_date? year, month, day
      valid_dates = false
      errors.add(:start_date, "Invalid start date.")
    end
    unless Date.valid_date? @endYear, endMonth, endDay
      valid_dates = false
      errors.add(:end_date, "Invalid end date.")
    end
    unless valid_dates
      # There's no use continuing validation at this point.
      return
    end

    if end_date < start_date
      errors.add(:end_date, "End date cannot be before start date.")
    end

    if @endYear != year
      errors.add(:end_date, "Competition dates cannot span multiple years.")
    end
  end

  private def events_must_be_valid
    invalid_events = events - Event.all_official - Event.all_deprecated
    unless invalid_events.empty?
      errors.add(:eventSpecs, "invalid event ids: #{invalid_events.map(&:id).join(',')}")
    end
  end

  def website_url_name
    match = PATTERN_LINK_RE.match website
    match ? match[1] : nil
  end

  def website_url
    match = PATTERN_LINK_RE.match website
    match ? match[2] : nil
  end
end
