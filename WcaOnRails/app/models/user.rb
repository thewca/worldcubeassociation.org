# frozen_string_literal: true
require "fileutils"

class User < ActiveRecord::Base
  has_many :competition_delegates, foreign_key: "delegate_id"
  has_many :delegated_competitions, through: :competition_delegates, source: "competition"
  has_many :competition_organizers, foreign_key: "organizer_id"
  has_many :organized_competitions, through: :competition_organizers, source: "competition"
  has_many :votes
  has_many :registrations
  has_many :competitions_registered_for, through: :registrations, source: "competition"
  belongs_to :person, -> { where(subId: 1) }, primary_key: "wca_id", foreign_key: "wca_id"
  belongs_to :unconfirmed_person, -> { where(subId: 1) }, primary_key: "wca_id", foreign_key: "unconfirmed_wca_id", class_name: "Person"
  belongs_to :delegate_to_handle_wca_id_claim, -> { where.not(delegate_status: nil ) }, foreign_key: "delegate_id_to_handle_wca_id_claim", class_name: "User"
  has_many :team_members, dependent: :destroy
  has_many :teams, -> { distinct }, through: :team_members
  has_many :current_team_members, -> { current }, class_name: "TeamMember"
  has_many :current_teams, -> { distinct }, through: :current_team_members, source: :team
  has_many :users_claiming_wca_id, foreign_key: "delegate_id_to_handle_wca_id_claim", class_name: "User"
  has_many :oauth_applications, class_name: 'Doorkeeper::Application', as: :owner
  has_many :user_preferred_events, dependent: :destroy
  has_many :preferred_events, through: :user_preferred_events, source: :event

  accepts_nested_attributes_for :user_preferred_events, allow_destroy: true

  strip_attributes only: [:wca_id, :country_iso2]

  attr_accessor :current_user

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :confirmable
  # When creating an account, we actually don't mind if the user leaves their
  # name empty, so long as they're a returning competitor and are claiming their
  # wca id.
  validates :name, presence: true, if: -> { !claiming_wca_id }
  WCA_ID_RE = /\A(|\d{4}[A-Z]{4}\d{2})\z/
  validates :wca_id, format: { with: WCA_ID_RE }, allow_nil: true
  validates :unconfirmed_wca_id, format: { with: WCA_ID_RE }, allow_nil: true
  WCA_ID_MAX_LENGTH = 10

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
        errors.add(:wca_id, I18n.t('users.errors.unique'))
      end
    end
  end

  validate :name_must_match_person_name
  def name_must_match_person_name
    if wca_id && !person
      errors.add(:wca_id, I18n.t('users.errors.not_found'))
    end
  end

  validate :dob_must_be_in_the_past
  def dob_must_be_in_the_past
    if dob && dob >= Date.today
      errors.add(:dob, I18n.t('users.errors.dob_past'))
    end
  end

  validate :cannot_demote_senior_delegate_with_subordinate_delegates
  def cannot_demote_senior_delegate_with_subordinate_delegates
    if delegate_status_was == "senior_delegate" && delegate_status != "senior_delegate" && !subordinate_delegates.empty?
      errors.add(:delegate_status, I18n.t('users.errors.senior_has_delegate'))
    end
  end

  attr_accessor :claiming_wca_id
  def claiming_wca_id=(claiming_wca_id)
    @claiming_wca_id = ActiveRecord::Type::Boolean.new.type_cast_from_database(claiming_wca_id)
  end

  before_validation :maybe_clear_claimed_wca_id
  def maybe_clear_claimed_wca_id
    unless claiming_wca_id
      if (unconfirmed_wca_id_was.present? && wca_id == unconfirmed_wca_id_was) || unconfirmed_wca_id.blank?
        self.unconfirmed_wca_id = nil
        self.delegate_to_handle_wca_id_claim = nil
      end
    end
  end

  # Virtual attribute for people claiming a WCA ID.
  attr_accessor :dob_verification

  validate :claim_wca_id_validations
  def claim_wca_id_validations
    already_assigned_to_user = false
    if unconfirmed_wca_id.present?
      already_assigned_to_user = unconfirmed_person && unconfirmed_person.user && !unconfirmed_person.user.dummy_account?
      if !unconfirmed_person
        errors.add(:unconfirmed_wca_id, I18n.t('users.errors.not_found'))
      elsif already_assigned_to_user
        errors.add(:unconfirmed_wca_id, I18n.t('users.errors.already_assigned'))
      end
    end

    if claiming_wca_id || (unconfirmed_wca_id.present? && unconfirmed_wca_id_change)
      if !delegate_id_to_handle_wca_id_claim.present?
        errors.add(:delegate_id_to_handle_wca_id_claim, I18n.t('simple_form.required.text'))
      end

      if !unconfirmed_wca_id.present?
        errors.add(:unconfirmed_wca_id, I18n.t('simple_form.required.text'))
      end

      dob_verification_date = Date.safe_parse(dob_verification, nil)
      if unconfirmed_person && (!current_user || !current_user.can_view_all_users?)
        if !unconfirmed_person.dob
          errors.add(:dob_verification, I18n.t('users.errors.wca_id_no_birthdate_html').html_safe)
        elsif !already_assigned_to_user && unconfirmed_person.dob != dob_verification_date
          # Note that we don't verify DOB for WCA IDs that have already been
          # claimed. This protects people from DOB guessing attacks.
          errors.add(:dob_verification, I18n.t('users.errors.dob_incorrect_html').html_safe)
        end
      end
      if claiming_wca_id && person
        errors.add(:unconfirmed_wca_id, I18n.t('users.errors.already_have_id', wca_id: wca_id))
      end

      if delegate_id_to_handle_wca_id_claim.present? && !delegate_to_handle_wca_id_claim
        errors.add(:delegate_id_to_handle_wca_id_claim, I18n.t('users.errors.not_found'))
      end
    end
  end

  scope :not_dummy_account, -> { where('wca_id = "" OR encrypted_password != "" OR email NOT LIKE "%@worldcubeassociation.org"') }
  def dummy_account?
    wca_id.present? && encrypted_password.blank? && email.casecmp("#{wca_id}@worldcubeassociation.org") == 0
  end

  scope :delegates, -> { where.not(delegate_status: nil) }

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

  validate :person_must_have_dob
  def person_must_have_dob
    p = person || unconfirmed_person
    if p && p.dob.nil?
      errors.add(:wca_id, I18n.t('users.errors.wca_id_no_birthdate_html'))
    end
  end

  # To handle profile pictures that predate our user account system, we created
  # a bunch of dummy accounts (accounts with no password). When someone finally
  # claims their WCA ID, we want to delete the dummy account and copy over their
  # avatar.
  before_save :remove_dummy_account_and_copy_name_when_wca_id_changed
  def remove_dummy_account_and_copy_name_when_wca_id_changed
    if wca_id_change && wca_id.present?
      dummy_user = User.where(wca_id: wca_id).find(&:dummy_account?)
      if dummy_user
        _mounter(:avatar).uploader.override_column_value = dummy_user.read_attribute :avatar
        dummy_user.destroy!
      end
    end
  end

  AVATAR_PARAMETERS = {
    file_size: {
      maximum: 2.megabytes.to_i,
    },
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
    filenames.select do |f|
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
      errors.add(:senior_delegate, I18n.t('users.errors.must_be_senior'))
    end
  end

  validate :senior_delegate_presence
  def senior_delegate_presence
    if !User.delegate_status_allows_senior_delegate(delegate_status) and senior_delegate
      errors.add(:senior_delegate, I18n.t('users.errors.must_not_be_present'))
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
    about_to_lose_access = !board_member?
    if current_user == self && about_to_lose_access
      if delegate_status_was == "board_member"
        errors.add(:delegate_status, I18n.t('users.errors.board_member_cannot_resign'))
      end
    end
  end

  validate :avatar_requires_wca_id
  def avatar_requires_wca_id
    if (!avatar.blank? || !pending_avatar.blank?) && wca_id.blank?
      errors.add(:avatar, I18n.t('users.errors.avatar_requires_wca_id'))
    end
  end

  after_save :remove_pending_wca_id_claims
  private def remove_pending_wca_id_claims
    if delegate_status_changed? && !delegate_status
      users_claiming_wca_id.each do |user|
        user.update delegate_id_to_handle_wca_id_claim: nil, unconfirmed_wca_id: nil
        senior_delegate = User.find_by_id(senior_delegate_id_was)
        WcaIdClaimMailer.notify_user_of_delegate_demotion(user, self, senior_delegate).deliver_later
      end
    end
  end

  # After the user confirms their account, if they claimed a WCA ID, now is the
  # time to notify their delegate!
  def after_confirmation
    if unconfirmed_wca_id.present?
      WcaIdClaimMailer.notify_delegate_of_wca_id_claim(self).deliver_later
    end
  end

  # For associated_events_picker
  def events_to_associated_events(events)
    events.map do |event|
      user_preferred_events.find_by_event_id(event.id) || user_preferred_events.build(event_id: event.id)
    end
  end

  def country
    Country.find_by_iso2(country_iso2)
  end

  def software_team?
    team_member?('software')
  end

  def results_team?
    team_member?('results')
  end

  def wrc_team?
    team_member?('wrc')
  end

  def wdc_team?
    team_member?('wdc')
  end

  def team_member?(team_friendly_id)
    self.current_team_members.where(team_id: Team.find_by_friendly_id!(team_friendly_id).id).count > 0
  end

  def team_leader?(team_friendly_id)
    self.current_team_members.where(team_id: Team.find_by_friendly_id!(team_friendly_id).id, team_leader: true).count > 0
  end

  def teams_where_is_leader
    self.current_team_members.where(team_leader: true).map(&:team).uniq
  end

  def admin?
    software_team?
  end

  def any_kind_of_delegate?
    delegate_status.present?
  end

  def can_view_all_users?
    admin? || board_member? || results_team? || any_kind_of_delegate?
  end

  def can_edit_user?(user)
    self == user || can_view_all_users? || organizer_for?(user)
  end

  def organizer_for?(user)
    # If the user is a newcomer, allow organizers of the competition that the user is registered for to edit that user's name.
    user.competitions_registered_for.not_over.joins(:competition_organizers).pluck("competition_organizers.organizer_id").include?(self.id)
  end

  def can_admin_results?
    admin? || board_member? || results_team?
  end

  # Returns true if the user can perform every action for teams.
  def can_manage_teams?
    admin? || board_member? || results_team?
  end

  # Returns true if the user can edit the given team.
  def can_edit_team?(team)
    can_manage_teams? || team_leader?(team.friendly_id)
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

  def can_view_hidden_competitions?
    can_admin_results? || self.any_kind_of_delegate?
  end

  def can_edit_registration?(registration)
    can_manage_competition?(registration.competition) || (!registration.accepted? && registration.user_id == self.id)
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

  def can_view_delegate_report?(delegate_report)
    if delegate_report.posted?
      any_kind_of_delegate? || can_admin_results? || wrc_team? || wdc_team?
    else
      delegate_report.competition.delegates.include?(self) || can_admin_results?
    end
  end

  def can_edit_delegate_report?(delegate_report)
    competition = delegate_report.competition
    can_admin_results? || (competition.delegates.include?(self) && !delegate_report.posted?)
  end

  def can_see_admin_competitions?
    board_member? || senior_delegate? || admin?
  end

  def get_cannot_delete_competition_reason(competition)
    # Only allow results admins and competition delegates to delete competitions.
    if !can_manage_competition?(competition)
      I18n.t('competitions.errors.cannot_manage')
    elsif competition.showAtAll
      I18n.t('competitions.errors.cannot_delete_public')
    elsif competition.isConfirmed && !self.can_admin_results?
      I18n.t('competitions.errors.cannot_delete_confirmed')
    else
      nil
    end
  end

  def cannot_register_for_competition_reasons
    reasons = []

    if name.blank?
      reasons << I18n.t('registrations.errors.need_name')
    end
    if gender.blank?
      reasons << I18n.t('registrations.errors.need_gender')
    end
    if dob.blank?
      reasons << I18n.t('registrations.errors.need_dob')
    end
    if country_iso2.blank?
      reasons << I18n.t('registrations.errors.need_country')
    end

    reasons
  end

  def cannot_edit_data_reason_html(user_to_edit)
    # Don't allow editing data if they have a WCA ID, or if they
    # have already registered for a competition. We do allow admins and delegates
    # who have registered for a competition to edit their own data.
    cannot_edit_reason = if user_to_edit.wca_id
                           # Not using _html suffix as automatic html_safe is available only from
                           # the view helper
                           I18n.t('users.edit.cannot_edit.reason.assigned')
                         elsif user_to_edit == self && !(admin? || any_kind_of_delegate?) && user_to_edit.registrations.accepted.count > 0
                           I18n.t('users.edit.cannot_edit.reason.registered')
                         end
    if cannot_edit_reason
      I18n.t('users.edit.cannot_edit.msg',
             reason: cannot_edit_reason,
             delegate_url: Rails.application.routes.url_helpers.delegates_path).html_safe
    end
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
      fields += %i(
        current_password password password_confirmation
        email preferred_events results_notifications_enabled
      )
      fields << { user_preferred_events_attributes: [:id, :event_id, :_destroy] }
    end
    if admin? || board_member?
      fields += %i(delegate_status senior_delegate_id region)
    end
    if user.any_kind_of_delegate? && (user == self || user.senior_delegate == self || admin? || board_member?)
      fields += %i(location_description phone_number notes)
    end
    if admin? || any_kind_of_delegate?
      fields += %i(
        wca_id unconfirmed_wca_id
        avatar avatar_cache
      )
    end
    if user == self || admin? || any_kind_of_delegate?
      cannot_edit_data = !!cannot_edit_data_reason_html(user)
      if !cannot_edit_data
        fields += %i(name dob gender country_iso2)
      end
      fields += CLAIM_WCA_ID_PARAMS
      fields += %i(
        pending_avatar pending_avatar_cache remove_pending_avatar
        avatar_crop_x avatar_crop_y avatar_crop_w avatar_crop_h
        pending_avatar_crop_x pending_avatar_crop_y pending_avatar_crop_w pending_avatar_crop_h
        remove_avatar
      )
    end
    if user.wca_id.blank? && organizer_for?(user)
      fields << :name
    end
    fields
  end

  def notify_of_results_posted(competition)
    if results_notifications_enabled?
      CompetitionsMailer.notify_users_of_results_presence(self, competition).deliver_later
    end
  end

  def notify_of_id_claim_possibility(competition)
    if !wca_id && !unconfirmed_wca_id
      CompetitionsMailer.notify_users_of_id_claim_possibility(self, competition).deliver_later
    end
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
    users = Person.includes(:user)
    unless ActiveRecord::Type::Boolean.new.type_cast_from_database(params[:persons_table])
      users = User.where.not(confirmed_at: nil).not_dummy_account

      if ActiveRecord::Type::Boolean.new.type_cast_from_database(params[:only_delegates])
        users = users.where.not(delegate_status: nil)
      end

      if ActiveRecord::Type::Boolean.new.type_cast_from_database(params[:only_with_wca_ids])
        users = users.where.not(wca_id: nil)
      end
    end

    query.split.each do |part|
      users = users.where("name LIKE :part OR wca_id LIKE :part", part: "%#{part}%")
    end

    users.order(:name)
  end

  attr_accessor :doorkeeper_token
  def serializable_hash(options = nil)
    json = {
      class: self.class.to_s.downcase,
      url: "/results/p.php?i=#{self.wca_id}",

      id: self.id,
      wca_id: self.wca_id,
      name: self.name,
      gender: self.gender,
      country_iso2: self.country_iso2,
      delegate_status: delegate_status,
      created_at: self.created_at,
      updated_at: self.updated_at,
      teams: current_team_members.includes(:team).map do |team_member|
        {
          friendly_id: team_member.team.friendly_id,
          leader: team_member.team_leader?,
        }
      end,
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

  # Devise's method overriding! (the unwanted lines are commented)
  # We have the separate form for updating password and it requires current_password to be entered.
  # So we don't want to remove the password and password_confirmation if they are in the params and are blank.
  # Instead we want the presence validations to fail in order to show the error messages to the user.
  # Also see: https://github.com/plataformatec/devise/blob/48220f087bc807629b42d731f6b68fe625edbb91/lib/devise/models/database_authenticatable.rb#L58-L64
  def update_with_password(params, *options)
    current_password = params.delete(:current_password)

    # if params[:password].blank?
    #   params.delete(:password)
    #   params.delete(:password_confirmation) if params[:password_confirmation].blank?
    # end

    result = if valid_password?(current_password)
               update_attributes(params, *options)
             else
               self.assign_attributes(params, *options)
               self.valid?
               self.errors.add(:current_password, current_password.blank? ? :blank : :invalid)
               false
             end

    clean_up_passwords
    result
  end
end
