require "fileutils"

class User < ActiveRecord::Base
  has_many :competition_delegates, foreign_key: "delegate_id"
  has_many :delegated_competitions, through: :competition_delegates, source: "competition"
  has_many :competition_organizers, foreign_key: "organizer_id"
  has_many :organized_competitions, through: :competition_organizers, source: "competition"
  has_many :votes
  has_many :registrations
  has_many :competitions_registered_for, through: :registrations, source: "competition"
  belongs_to :person, foreign_key: "wca_id"
  belongs_to :unconfirmed_person, foreign_key: "unconfirmed_wca_id", class_name: "Person"
  belongs_to :delegate_to_handle_wca_id_claim, -> { where.not(delegate_status: nil ) }, foreign_key: "delegate_id_to_handle_wca_id_claim", class_name: "User"
  has_many :teams, through: :team_members
  has_many :team_members, dependent: :destroy
  has_many :users_claiming_wca_id, foreign_key: "delegate_id_to_handle_wca_id_claim", class_name: "User"
  has_many :oauth_applications, class_name: 'Doorkeeper::Application', as: :owner

  strip_attributes only: [:wca_id, :country_iso2]

  attr_accessor :current_user

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :confirmable
  validates :name, presence: true
  WCA_ID_RE = /\A(|\d{4}[A-Z]{4}\d{2})\z/
  validates :wca_id, format: { with: WCA_ID_RE }, allow_nil: true
  validates :unconfirmed_wca_id, format: { with: WCA_ID_RE }, allow_nil: true
  WCA_ID_MAX_LENGTH = 10

  validates :country_iso2, inclusion: { in: Country.all.map(&:iso2), message: "%{value} is not a valid country" }, allow_nil: true

  # Virtual attribute for authenticating by WCA ID or email.
  attr_accessor :login

  # Virtual attribute for remembering what the user clicked on when
  # signing up for an account.
  attr_accessor :sign_up_panel_to_show

  ALLOWABLE_GENDERS = [:m, :f, :o]
  enum gender: (ALLOWABLE_GENDERS.map { |g| [ g, g.to_s ] }.to_h)

  enum delegate_status: {
    candidate_delegate: "candidate_delegate",
    delegate: "delegate",
    senior_delegate: "senior_delegate",
    board_member: "board_member",
  }
  has_many :subordinate_delegates, class_name: "User", foreign_key: "senior_delegate_id"
  belongs_to :senior_delegate, -> { where(delegate_status: "senior_delegate").order(:name) }, class_name: "User"

  validate :wca_id_is_unique_or_for_dummy_account
  def wca_id_is_unique_or_for_dummy_account
    if wca_id_change && wca_id
      user = User.find_by_wca_id(wca_id)
      # If there is a non dummy user with this WCA ID, fail validation.
      if user && !user.dummy_account?
        errors.add(:wca_id, "must be unique")
      end
    end
  end

  validate :name_must_match_person_name
  def name_must_match_person_name
    if wca_id && !person
      errors.add(:wca_id, "not found")
    end
  end

  validate :dob_must_be_in_the_past
  def dob_must_be_in_the_past
    if dob && dob >= Date.today
      errors.add(:dob, "must be in the past")
    end
  end

  validate :cannot_demote_senior_delegate_with_subordinate_delegates
  def cannot_demote_senior_delegate_with_subordinate_delegates
    if delegate_status_was == "senior_delegate" && delegate_status != "senior_delegate" && subordinate_delegates.length != 0
      errors.add(:delegate_status, "cannot demote senior delegate with subordinate delegates")
    end
  end

  attr_accessor :claiming_wca_id
  before_validation :maybe_clear_claimed_wca_id
  def maybe_clear_claimed_wca_id
    if !claiming_wca_id && unconfirmed_wca_id_was.present?
      if wca_id == unconfirmed_wca_id_was || unconfirmed_wca_id.blank?
        self.unconfirmed_wca_id = nil
        self.delegate_to_handle_wca_id_claim = nil
      end
    end
  end

  # Virtual attribute for people claiming a WCA ID.
  attr_accessor :dob_verification

  validate :claim_wca_id_validations
  def claim_wca_id_validations
    if unconfirmed_wca_id.present? && !delegate_id_to_handle_wca_id_claim.present?
      errors.add(:delegate_id_to_handle_wca_id_claim, "required")
    end

    if !unconfirmed_wca_id.present? && delegate_id_to_handle_wca_id_claim.present?
      errors.add(:unconfirmed_wca_id, "required")
    end

    if unconfirmed_wca_id.present?
      already_assigned_to_user = unconfirmed_person && unconfirmed_person.user && !unconfirmed_person.user.dummy_account?
      if !unconfirmed_person
        errors.add(:unconfirmed_wca_id, "not found")
      elsif already_assigned_to_user
        errors.add(:unconfirmed_wca_id, "already assigned to a different user")
      end

      if claiming_wca_id
        dob_verification_date = Date.safe_parse(dob_verification, nil)
        if unconfirmed_person
          if !unconfirmed_person.dob
            errors.add(:dob_verification, "WCA ID does not have a birthdate. Contact the Results team to resolve this.")
          elsif !already_assigned_to_user && unconfirmed_person.dob != dob_verification_date
            # Note that we don't verify DOB for WCA IDs that have already been
            # claimed. This protects people from DOB guessing attacks.
            errors.add(:dob_verification, "incorrect")
          end
        end
        if person
          errors.add(:unconfirmed_wca_id, "cannot claim a WCA ID because you already have WCA ID #{wca_id}")
        end
      end
    end

    if delegate_id_to_handle_wca_id_claim.present? && !delegate_to_handle_wca_id_claim
      errors.add(:delegate_id_to_handle_wca_id_claim, "not found")
    end
  end

  def dummy_account?
    wca_id.present? && encrypted_password.blank? && email.downcase == "#{wca_id}@worldcubeassociation.org".downcase
  end

  before_validation :copy_data_from_persons
  def copy_data_from_persons
    p = person || unconfirmed_person
    if p
      self.name = p.name
      self.dob = p.dob
      self.gender = p.gender
      self.country_iso2 = p.country_iso2
    end
  end

  # To handle profile pictures that predate our user account system, we created
  # a bunch of dummy accounts (accounts with no password). When someone finally
  # claims their WCA ID, we want to delete the dummy account and copy over their
  # avatar.
  before_save :remove_dummy_account_and_copy_name_when_wca_id_changed
  def remove_dummy_account_and_copy_name_when_wca_id_changed
    if wca_id_change && wca_id.present?
      dummy_user = User.where(wca_id: wca_id).select(&:dummy_account?).first
      if dummy_user
        _mounter(:avatar).uploader.override_column_value = dummy_user.read_attribute :avatar
        dummy_user.destroy!
      end
    end
  end

  AVATAR_PARAMETERS = {
    file_size: {
      maximum: 2.megabytes.to_i
    }
  }

  mount_uploader :pending_avatar, PendingAvatarUploader
  crop_uploaded :pending_avatar
  validates :pending_avatar, AVATAR_PARAMETERS

  mount_uploader :avatar, AvatarUploader
  # Don't delete avatar when this model is destroyed. User models should almost never be
  # destroyed, except when we're deleting dummy accounts.
  skip_callback :commit, :after, :remove_avatar!
  crop_uploaded :avatar
  validates :avatar, AVATAR_PARAMETERS

  def old_avatar_filenames
    avatar_uploader = AvatarUploader.new(self)
    store_dir = "public/#{avatar_uploader.store_dir}"
    filenames = Dir.glob("#{store_dir}/*[0-9].{#{avatar_uploader.extension_white_list.join(",")}}").sort
    filenames = filenames.select do |f|
      (!pending_avatar.path || !File.identical?(pending_avatar.path, f)) && (!avatar.path || !File.identical?(avatar.path, f))
    end
  end

  before_save :stash_rejected_avatar
  def stash_rejected_avatar
    if ActiveRecord::Type::Boolean.new.type_cast_from_database(remove_pending_avatar) && pending_avatar_was
      avatar_uploader = AvatarUploader.new(self)
      store_dir = "public/#{avatar_uploader.store_dir}"
      filename = "#{store_dir}/#{pending_avatar_was}"
      rejected_filename = "#{store_dir}/rejected/#{pending_avatar_was}"
      FileUtils.mkdir_p Pathname.new(rejected_filename).parent.to_path
      FileUtils.mv filename, rejected_filename
    end
  end

  before_validation :maybe_save_crop_coordinates
  def maybe_save_crop_coordinates
    self.saved_avatar_crop_x = avatar_crop_x if avatar_crop_x
    self.saved_avatar_crop_y = avatar_crop_y if avatar_crop_y
    self.saved_avatar_crop_w = avatar_crop_w if avatar_crop_w
    self.saved_avatar_crop_h = avatar_crop_h if avatar_crop_h

    self.saved_pending_avatar_crop_x = pending_avatar_crop_x if pending_avatar_crop_x
    self.saved_pending_avatar_crop_y = pending_avatar_crop_y if pending_avatar_crop_y
    self.saved_pending_avatar_crop_w = pending_avatar_crop_w if pending_avatar_crop_w
    self.saved_pending_avatar_crop_h = pending_avatar_crop_h if pending_avatar_crop_h
  end

  before_validation :maybe_clear_crop_coordinates
  def maybe_clear_crop_coordinates
    if ActiveRecord::Type::Boolean.new.type_cast_from_database(remove_avatar)
      self.saved_avatar_crop_x = nil
      self.saved_avatar_crop_y = nil
      self.saved_avatar_crop_w = nil
      self.saved_avatar_crop_h = nil
    end
    if ActiveRecord::Type::Boolean.new.type_cast_from_database(remove_pending_avatar)
      self.saved_pending_avatar_crop_x = nil
      self.saved_pending_avatar_crop_y = nil
      self.saved_pending_avatar_crop_w = nil
      self.saved_pending_avatar_crop_h = nil
    end
  end

  validate :senior_delegate_must_be_senior_delegate
  def senior_delegate_must_be_senior_delegate
    if senior_delegate && !senior_delegate.senior_delegate?
      errors.add(:senior_delegate, "must be a senior delegate")
    end
  end

  validate :senior_delegate_presence
  def senior_delegate_presence
    if !User.delegate_status_allows_senior_delegate(delegate_status) and senior_delegate
      errors.add(:senior_delegate, "must not be present")
    end
  end

  def self.delegate_status_allows_senior_delegate(delegate_status)
    {
      nil => false,
      "" => false,
      "candidate_delegate" => true,
      "delegate" => true,
      "senior_delegate" => false,
      "board_member" => false,
    }.fetch(delegate_status)
  end

  validate :not_illegally_demoting_oneself
  def not_illegally_demoting_oneself
    about_to_lose_access = !software_team? && !board_member?
    if current_user == self && about_to_lose_access
      if self.was_team_member?('software')
        errors.add(:admin, "You cannot resign from your role as a software admin team member! Find another person to fire you.")
      elsif delegate_status_was == "board_member"
        errors.add(:delegate_status, "You cannot resign from your role as a board member! Find another board member to fire you.")
      end
    end
  end

  validate :avatar_requires_wca_id
  def avatar_requires_wca_id
    if (!avatar.blank? || !pending_avatar.blank?) && wca_id.blank?
      errors.add(:avatar, "requires a WCA ID to be assigned")
    end
  end

  # After the user confirms their account, if they claimed a WCA ID, now is the
  # time to notify their delegate!
  def after_confirmation
    if unconfirmed_wca_id
      WcaIdClaimMailer.notify_delegate_of_wca_id_claim(self).deliver_now
    end
  end

  def software_team?
    team_member?('software') != false
  end

  def results_team?
    team_member?('results') != false
  end

  def wrc_team?
    team_member?('wrc') != false
  end

  def wdc_team?
    team_member?('wdc') != false
  end

  def team_member?(team)
    member = self.team_members.find_by_team_id( self.teams.find_by_friendly_id(team) )
    if member && (member.end_date == nil || member.end_date >= Date.today)
      return member
    else
      return false
    end
  end

  def was_team_member?(team)
    member = self.team_members.find_by_team_id( self.teams.find_by_friendly_id(team) )
    if member && member.end_date != nil && member.end_date < Date.today
      return true
    else
      return false
    end
  end

  def team_leader?(team)
    team_member?(team) && team_member(team).team_leader
  end

  def admin?
    software_team?
  end

  def any_kind_of_delegate?
    delegate_status.present?
  end

  def can_edit_users?
    admin? || board_member? || any_kind_of_delegate?
  end

  def can_admin_results?
    admin? || board_member? || results_team?
  end

  def can_create_competitions?
    can_admin_results? || any_kind_of_delegate?
  end

  def can_view_crash_course?
    admin? || board_member? || any_kind_of_delegate? || results_team? || wdc_team? || wrc_team?
  end

  def can_create_posts?
    admin? || board_member? || results_team? || wdc_team? || wrc_team?
  end

  def can_update_crash_course?
    admin? || board_member? || results_team?
  end

  def can_manage_competition?(competition)
    can_admin_results? || competition.organizers.include?(self) || competition.delegates.include?(self)
  end

  def can_edit_registration?(registration)
    can_manage_competition?(registration.competition) || (registration.pending? && registration.user_id == self.id)
  end

  def can_confirm_competition?(competition)
    # We don't let competition organizers confirm competitions.
    can_admin_results? || competition.delegates.include?(self)
  end

  def can_create_poll?
    admin? || board_member? || wrc_team? || wdc_team?
  end

  def can_vote_in_poll?
    admin? || results_team? || any_kind_of_delegate? || wrc_team?
  end

  def get_cannot_delete_competition_reason(competition)
    # Only allow results admins and competition delegates to delete competitions.
    if !can_manage_competition?(competition)
      "Cannot manage competition."
    elsif competition.showAtAll
      "Cannot delete a competition that is publicly visible."
    elsif competition.isConfirmed && !self.can_admin_results?
      "Cannot delete a confirmed competition."
    else
      nil
    end
  end

  def cannot_register_for_competition_reasons
    reasons = []

    if name.blank?
      reasons << "Need a name"
    end
    if gender.blank?
      reasons << "Need a gender"
    end
    if dob.blank?
      reasons << "Need a birthdate"
    end
    if country_iso2.blank?
      reasons << "Need a country"
    end

    reasons
  end

  def cannot_edit_data_reason_html(user_to_edit)
    # Don't allow editing data if they have a WCA ID, or if they
    # have already registered for a competition. We do allow admins and delegates
    # who have registered for a competition to edit their own data.
    msg = "You cannot change your name, birthdate, gender, or country because %s. Contact your <a href='#{Rails.application.routes.url_helpers.delegates_path}'>delegate</a> if you need to change any of these."
    if user_to_edit.wca_id
      return (msg % "you have a WCA ID assigned").html_safe
    end
    if user_to_edit == self && !(admin? || any_kind_of_delegate?) && user_to_edit.registrations.count > 0
      return (msg % "you have registered for a competition").html_safe
    end
    return nil
  end

  CLAIM_WCA_ID_PARAMS = [
    :claiming_wca_id,
    :unconfirmed_wca_id,
    :delegate_id_to_handle_wca_id_claim,
    :dob_verification,
  ]

  def editable_fields_of_user(user)
    fields = Set.new
    if user.dummy_account?
      return fields
    end
    if user == self
      fields << :current_password
      fields << :password << :password_confirmation
      fields << :email
    end
    if admin? || board_member?
      fields += UsersController.WCA_TEAMS
      fields += UsersController.WCA_TEAMS.map { |role| :"#{role}_leader" }
      fields << :delegate_status
      fields << :senior_delegate_id
      fields << :region
    end
    if admin? || any_kind_of_delegate?
      fields << :wca_id << :unconfirmed_wca_id
      fields << :avatar << :avatar_cache
    end
    if user == self || admin? || any_kind_of_delegate?
      cannot_edit_data = !!cannot_edit_data_reason_html(user)
      if !cannot_edit_data
        fields << :name
        fields << :dob
        fields << :gender
        fields << :country_iso2
      end
      fields += CLAIM_WCA_ID_PARAMS
      fields << :pending_avatar << :pending_avatar_cache << :remove_pending_avatar
      fields << :avatar_crop_x << :avatar_crop_y << :avatar_crop_w << :avatar_crop_h
      fields << :pending_avatar_crop_x << :pending_avatar_crop_y << :pending_avatar_crop_w << :pending_avatar_crop_h
      fields << :remove_avatar
    end
    fields
  end

  def self.find_first_by_auth_conditions(warden_conditions)
    conditions = warden_conditions.dup
    if login = conditions.delete(:login)
      where(conditions).where(["email = :email OR wca_id = :wca_id", { email: login.downcase, wca_id: login.upcase }]).first
    else
      where(conditions.to_hash).first
    end
  end

  def approve_pending_avatar!
    # Bypass the .avatar and .pending_avatar helpers that carrierwave creates
    # and write directly to the database.
    self.update_columns(
      avatar: self.read_attribute(:pending_avatar),
      saved_avatar_crop_x: self.saved_pending_avatar_crop_x, saved_avatar_crop_y: self.saved_pending_avatar_crop_y, saved_avatar_crop_w: self.saved_pending_avatar_crop_w, saved_avatar_crop_h: self.saved_pending_avatar_crop_h,
      pending_avatar: nil,
      saved_pending_avatar_crop_x: nil, saved_pending_avatar_crop_y: nil, saved_pending_avatar_crop_w: nil, saved_pending_avatar_crop_h: nil,
    )
  end

  def self.search(query, params: {})
    sql_query = "%#{query}%"

    users = nil
    if !ActiveRecord::Type::Boolean.new.type_cast_from_database(params[:persons_table])
      users = User

      if !ActiveRecord::Type::Boolean.new.type_cast_from_database(params[:include_dummy_accounts])
        # Ignore dummy accounts
        users = users.where.not(encrypted_password: '')
        # Ignore unconfirmed accounts
        users = users.where.not(confirmed_at: nil)
      end

      if ActiveRecord::Type::Boolean.new.type_cast_from_database(params[:only_delegates])
        users = users.where.not(delegate_status: nil)
      end

      if ActiveRecord::Type::Boolean.new.type_cast_from_database(params[:only_with_wca_ids])
        users = users.where.not(wca_id: nil)
      end
      users = users.where("name LIKE :sql_query OR wca_id LIKE :sql_query", sql_query: sql_query).order(:name)
    else
      users = Person.where("name LIKE :sql_query OR id LIKE :sql_query", sql_query: sql_query).order(:name)
    end

    users
  end

  def to_jsonable(doorkeeper_token: nil)
    json = {
      class: self.class.to_s.downcase,
      url: "/results/p.php?i=#{self.wca_id}",

      id: self.id,
      wca_id: self.wca_id,
      name: self.name,
      gender: self.gender,
      country_iso2: self.country_iso2,
      created_at: self.created_at,
      updated_at: self.updated_at,
      avatar: {
        url: self.avatar.url,
        thumb_url: self.avatar.url(:thumb),
        is_default: !self.avatar?,
      },
    }

    if doorkeeper_token
      if doorkeeper_token.scopes.exists?("dob")
        json[:dob] = self.dob
      end

      if doorkeeper_token.scopes.exists?("email")
        json[:email] = self.email
      end
    end

    json
  end
end
