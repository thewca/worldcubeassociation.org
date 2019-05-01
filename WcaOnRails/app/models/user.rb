# frozen_string_literal: true

require "fileutils"

class User < ApplicationRecord
  has_many :competition_delegates, foreign_key: "delegate_id"
  has_many :delegated_competitions, through: :competition_delegates, source: "competition"
  has_many :competition_organizers, foreign_key: "organizer_id"
  has_many :organized_competitions, through: :competition_organizers, source: "competition"
  has_many :votes
  has_many :registrations
  has_many :competitions_registered_for, through: :registrations, source: "competition"
  belongs_to :person, -> { where(subId: 1) }, primary_key: "wca_id", foreign_key: "wca_id"
  belongs_to :unconfirmed_person, -> { where(subId: 1) }, primary_key: "wca_id", foreign_key: "unconfirmed_wca_id", class_name: "Person"
  belongs_to :delegate_to_handle_wca_id_claim, -> { where.not(delegate_status: nil) }, foreign_key: "delegate_id_to_handle_wca_id_claim", class_name: "User"
  has_many :team_members, dependent: :destroy
  has_many :teams, -> { distinct }, through: :team_members
  has_many :current_team_members, -> { current }, class_name: "TeamMember"
  has_many :current_teams, -> { distinct }, through: :current_team_members, source: :team
  has_many :confirmed_users_claiming_wca_id, -> { confirmed_email }, foreign_key: "delegate_id_to_handle_wca_id_claim", class_name: "User"
  has_many :oauth_applications, class_name: 'Doorkeeper::Application', as: :owner
  has_many :user_preferred_events, dependent: :destroy
  has_many :preferred_events, through: :user_preferred_events, source: :event

  scope :confirmed_email, -> { where.not(confirmed_at: nil) }

  scope :in_region, lambda { |region_id|
    unless region_id.blank? || region_id == 'all'
      where(country_iso2: (Continent.country_iso2s(region_id) || Country.c_find(region_id)&.iso2))
    end
  }

  def self.eligible_voters
    team_leaders = TeamMember.current.in_official_team.leader.map(&:user)
    team_senior_members = TeamMember.current.in_official_team.senior_member.map(&:user)
    eligible_delegates = User.where(delegate_status: %w(delegate senior_delegate))
    board_members = TeamMember.current.where(team_id: Team.board.id).map(&:user)
    officers = TeamMember.current.where(team_id: Team.all_officers.map(&:id)).map(&:user)
    (team_leaders + team_senior_members + eligible_delegates + board_members + officers).uniq
  end

  def self.leader_senior_voters
    team_leaders = TeamMember.current.in_official_team.leader.map(&:user)
    senior_delegates = User.where(delegate_status: "senior_delegate")
    (team_leaders + senior_delegates).uniq
  end

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
  WCA_ID_RE = /\A(|\d{4}[A-Z]{4}\d{2})\z/.freeze
  validates :wca_id, format: { with: WCA_ID_RE }, allow_nil: true
  validates :unconfirmed_wca_id, format: { with: WCA_ID_RE }, allow_nil: true
  WCA_ID_MAX_LENGTH = 10

  # Virtual attribute for authenticating by WCA ID or email.
  attr_accessor :login

  # Virtual attribute for remembering what the user clicked on when
  # signing up for an account.
  attr_accessor :sign_up_panel_to_show

  ALLOWABLE_GENDERS = [:m, :f, :o].freeze
  enum gender: (ALLOWABLE_GENDERS.map { |g| [g, g.to_s] }.to_h)
  GENDER_LABEL_METHOD = lambda do |g|
    {
      m: I18n.t('enums.user.gender.m'),
      f: I18n.t('enums.user.gender.f'),
      o: I18n.t('enums.user.gender.o'),
    }[g]
  end

  enum delegate_status: {
    candidate_delegate: "candidate_delegate",
    delegate: "delegate",
    senior_delegate: "senior_delegate",
  }
  has_many :subordinate_delegates, class_name: "User", foreign_key: "senior_delegate_id"
  belongs_to :senior_delegate, -> { where(delegate_status: "senior_delegate").order(:name) }, class_name: "User"

  validate :wca_id_is_unique_or_for_dummy_account
  def wca_id_is_unique_or_for_dummy_account
    if wca_id_change && wca_id
      user = User.find_by_wca_id(wca_id)
      # If there is a non dummy user with this WCA ID, fail validation.
      if user && !user.dummy_account?
        errors.add(
          :wca_id,
          I18n.t('users.errors.unique',
                 used_name: user.name,
                 used_email: user.email),
        )
      end
    end
  end

  validate :name_must_match_person_name
  def name_must_match_person_name
    if wca_id && !person
      errors.add(:wca_id, I18n.t('users.errors.not_found'))
    end
  end

  validate :check_if_email_used_by_locked_account, on: :create
  private def check_if_email_used_by_locked_account
    if User.find_by(email: email)&.locked_account?
      errors.delete(:email)
      errors.add(:email, I18n.t('users.errors.email_used_by_locked_account_html').html_safe)
    end
  end

  validate do
    if dob && dob >= Date.today
      errors.add(:dob, I18n.t('users.errors.dob_past'))
    elsif dob && dob >= 2.years.ago
      errors.add(:dob, I18n.t('users.errors.dob_recent'))
    end
  end

  validate :cannot_demote_senior_delegate_with_subordinate_delegates
  def cannot_demote_senior_delegate_with_subordinate_delegates
    if delegate_status_was == "senior_delegate" && delegate_status != "senior_delegate" && !subordinate_delegates.empty?
      errors.add(:delegate_status, I18n.t('users.errors.senior_has_delegate'))
    end
  end

  attr_reader :claiming_wca_id
  def claiming_wca_id=(claiming_wca_id)
    @claiming_wca_id = ActiveRecord::Type::Boolean.new.cast(claiming_wca_id)
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
  attr_accessor :was_incorrect_wca_id_claim

  MAX_INCORRECT_WCA_ID_CLAIM_COUNT = 5
  validate :claim_wca_id_validations
  def claim_wca_id_validations
    self.was_incorrect_wca_id_claim = false
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
        dob_form_path = Rails.application.routes.url_helpers.contact_dob_path
        remaining_wca_id_claims = [0, MAX_INCORRECT_WCA_ID_CLAIM_COUNT - unconfirmed_person.incorrect_wca_id_claim_count].max
        if remaining_wca_id_claims == 0 || !unconfirmed_person.dob
          errors.add(:dob_verification, I18n.t('users.errors.wca_id_no_birthdate_html', dob_form_path: dob_form_path).html_safe)
        elsif unconfirmed_person.gender.blank?
          errors.add(:gender, I18n.t('users.errors.wca_id_no_gender_html').html_safe)
        elsif !already_assigned_to_user && unconfirmed_person.dob != dob_verification_date
          # Note that we don't verify DOB for WCA IDs that have already been
          # claimed. This protects people from DOB guessing attacks.
          self.was_incorrect_wca_id_claim = true
          errors.add(:dob_verification, I18n.t('users.errors.dob_incorrect_html', dob_form_path: dob_form_path).html_safe)
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

  after_rollback do
    # This is a bit of a mess. If the user makes an incorrect WCA ID claim,
    # then we want to incrememnt our count of incorrect claims. We can't update
    # the database in the `claim_wca_id_validations` above, because that all
    # happens in a transaction that gets rolled back if the claim is invalid.
    # So instead, we must do this in a `after_rollback` callback.
    unconfirmed_person.increment!(:incorrect_wca_id_claim_count, 1) if self.was_incorrect_wca_id_claim
  end

  scope :not_dummy_account, -> { where(dummy_account: false) }

  def locked_account?
    !dummy_account? && encrypted_password == ""
  end

  scope :candidate_delegates, -> { where(delegate_status: "candidate_delegate") }
  scope :delegates, -> { where.not(delegate_status: nil) }
  scope :senior_delegates, -> { where(delegate_status: "senior_delegate") }

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

  before_validation :strip_name
  def strip_name
    self.name = self.name.strip if self.name.present?
  end

  validate :wca_id_prereqs
  def wca_id_prereqs
    p = person || unconfirmed_person
    if p
      cannot_be_assigned_reasons = p.cannot_be_assigned_to_user_reasons
      unless cannot_be_assigned_reasons.empty?
        errors.add(:wca_id, cannot_be_assigned_reasons.xss_aware_to_sentence)
      end
    end
  end

  # To handle profile pictures that predate our user account system, we created
  # a bunch of dummy accounts (accounts with no password). When someone finally
  # claims their WCA ID, we want to delete the dummy account and copy over their
  # avatar.
  before_save :remove_dummy_account_and_copy_name_when_wca_id_changed
  def remove_dummy_account_and_copy_name_when_wca_id_changed
    if wca_id_change && wca_id.present?
      dummy_user = User.find_by(wca_id: wca_id, dummy_account: true)
      if dummy_user
        _mounter(:avatar).uploader.override_column_value = dummy_user.read_attribute :avatar
        dummy_user.destroy!
      end
    end
  end

  AVATAR_PARAMETERS = {
    file_size: {
      maximum: 2.megabytes.to_i,
    }.freeze,
  }.freeze

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
    if ActiveRecord::Type::Boolean.new.cast(remove_pending_avatar) && pending_avatar_was
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
    if ActiveRecord::Type::Boolean.new.cast(remove_avatar)
      self.saved_avatar_crop_x = nil
      self.saved_avatar_crop_y = nil
      self.saved_avatar_crop_w = nil
      self.saved_avatar_crop_h = nil
    end
    if ActiveRecord::Type::Boolean.new.cast(remove_pending_avatar)
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
    if !User.delegate_status_requires_senior_delegate(delegate_status) && senior_delegate
      errors.add(:senior_delegate, I18n.t('users.errors.must_not_be_present'))
    end
  end

  validates :senior_delegate, presence: true, if: -> { User.delegate_status_requires_senior_delegate(delegate_status) && !senior_delegate }

  # This is a copy of def self.delegate_status_requires_senior_delegate(delegate_status) in the user model
  # https://github.com/thewca/worldcubeassociation.org/blob/master/WcaOnRails/app/assets/javascripts/users.js#L3-L11
  # It is necessary to fix both files for changes to work
  def self.delegate_status_requires_senior_delegate(delegate_status)
    {
      nil => false,
      "" => false,
      "candidate_delegate" => true,
      "delegate" => true,
      "senior_delegate" => false,
    }.fetch(delegate_status)
  end

  validate :avatar_requires_wca_id
  def avatar_requires_wca_id
    if (!avatar.blank? || !pending_avatar.blank?) && wca_id.blank?
      errors.add(:avatar, I18n.t('users.errors.avatar_requires_wca_id'))
    end
  end

  after_save :remove_pending_wca_id_claims
  private def remove_pending_wca_id_claims
    if saved_change_to_delegate_status? && !delegate_status
      confirmed_users_claiming_wca_id.each do |user|
        senior_delegate = User.find_by_id(senior_delegate_id_before_last_save)
        WcaIdClaimMailer.notify_user_of_delegate_demotion(user, self, senior_delegate).deliver_later
      end
      # Clear all pending WCA IDs claims for the demoted Delegate
      User.where(delegate_to_handle_wca_id_claim: self.id).update_all(delegate_id_to_handle_wca_id_claim: nil, unconfirmed_wca_id: nil)
    end
  end

  # This method was copied and overridden from https://github.com/plataformatec/devise/blob/master/lib/devise/models/confirmable.rb#L182
  # to enable separate emails for sign-up and email reconfirmation
  def send_on_create_confirmation_instructions
    NewRegistrationMailer.send_registration_mail(self).deliver_now
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

  def locale
    preferred_locale || I18n.default_locale
  end

  def board_member?
    team_member?(Team.board)
  end

  # Officers are defined in our Bylaws. Every Officer has a team on the website except for the WCA Treasurer, as it is the WFC Leader.
  def officer?
    team_member?(Team.chair) || team_member?(Team.executive_director) || team_member?(Team.secretary) || team_member?(Team.vice_chair) || team_leader?(Team.wfc)
  end

  def communication_team?
    team_member?(Team.wct)
  end

  def competition_announcement_team?
    team_member?(Team.wcat)
  end

  def wdc_team?
    team_member?(Team.wdc)
  end

  def wdpc_team?
    team_member?(Team.wdpc)
  end

  def ethics_committee?
    team_member?(Team.wec)
  end

  def financial_committee?
    team_member?(Team.wfc)
  end

  def marketing_team?
    team_member?(Team.wmt)
  end

  def quality_assurance_committee?
    team_member?(Team.wqac)
  end

  def wrc_team?
    team_member?(Team.wrc)
  end

  def results_team?
    team_member?(Team.wrt)
  end

  def software_team?
    team_member?(Team.wst)
  end

  def wac_team?
    team_member?(Team.wac)
  end

  def staff?
    any_kind_of_delegate? || member_of_any_official_team? || board_member? || officer?
  end

  def staff_with_voting_rights?
    # See "Member with Voting Rights" in:
    #  https://www.worldcubeassociation.org/documents/motions/02.2019.1%20-%20Definitions.pdf
    full_delegate? || senior_delegate? || senior_member_of_any_official_team? || leader_of_any_official_team? || board_member? || officer?
  end

  def team_member?(team)
    self.current_team_members.select { |t| t.team_id == team.id }.count > 0
  end

  def team_senior_member?(team)
    self.current_team_members.select { |t| t.team_id == team.id && t.team_senior_member }.count > 0
  end

  def team_leader?(team)
    self.current_team_members.select { |t| t.team_id == team.id && t.team_leader }.count > 0
  end

  def member_of_any_official_team?
    self.current_teams.any?(&:official?)
  end

  def senior_member_of_any_official_team?
    self.teams_where_is_senior_member.any?(&:official?)
  end

  def leader_of_any_official_team?
    self.teams_where_is_leader.any?(&:official?)
  end

  def teams_where_is_senior_member
    self.current_team_members.select(&:team_senior_member).map(&:team).uniq
  end

  def teams_where_is_leader
    self.current_team_members.select(&:team_leader).map(&:team).uniq
  end

  def admin?
    software_team?
  end

  def any_kind_of_delegate?
    delegate_status.present?
  end

  def full_delegate?
    delegate_status == "delegate"
  end

  def senior_delegate?
    delegate_status == "senior_delegate"
  end

  def can_view_all_users?
    admin? || board_member? || results_team? || communication_team? || wdc_team? || wdpc_team? || any_kind_of_delegate?
  end

  def can_view_senior_delegate_material?
    admin? || board_member? || senior_delegate?
  end

  def can_view_leader_material?
    admin? || board_member? || leader_of_any_official_team?
  end

  def can_edit_user?(user)
    self == user || can_view_all_users? || organizer_for?(user)
  end

  def can_edit_notes_of_user?(user)
    user.senior_delegate == self || admin? || board_member?
  end

  def can_change_users_avatar?(user)
    user.wca_id.present? && self.editable_fields_of_user(user).include?(:remove_avatar)
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
    can_manage_teams? ||
      team_leader?(team) ||

      # The leader of the WDC can edit the banned competitors list
      (team == Team.banned && team_leader?(Team.wdc))
  end

  def can_view_banned_competitors?
    admin? || staff?
  end

  def can_create_competitions?
    can_admin_results? || any_kind_of_delegate?
  end

  def can_view_delegate_crash_course?
    can_view_delegate_matters? || communication_team?
  end

  def can_create_posts?
    wdc_team? || wrc_team? || communication_team? || can_announce_competitions?
  end

  def can_update_delegate_crash_course?
    can_admin_competitions? || quality_assurance_committee?
  end

  def can_admin_competitions?
    can_admin_results? || competition_announcement_team?
  end

  alias_method :can_announce_competitions?, :can_admin_competitions?

  def can_manage_competition?(competition)
    can_admin_competitions? || competition.organizers.include?(self) || competition.delegates.include?(self) || wrc_team? || competition.delegates.map(&:senior_delegate).compact.include?(self)
  end

  def can_view_hidden_competitions?
    can_admin_competitions? || self.any_kind_of_delegate?
  end

  def can_edit_registration?(registration)
    # A registration can be edited by a user if it hasn't been accepted yet, and if registrations are open.
    editable_by_user = !registration.accepted? && registration.competition.registration_opened?
    can_manage_competition?(registration.competition) || (registration.user_id == self.id && editable_by_user)
  end

  def can_confirm_competition?(competition)
    # We don't let competition organizers confirm competitions.
    can_admin_results? || competition.delegates.include?(self)
  end

  def can_add_and_remove_events?(competition)
    can_admin_competitions? || (can_manage_competition?(competition) && !competition.confirmed?)
  end

  def can_submit_competition_results?(competition)
    appropriate_role = can_admin_results? || competition.delegates.include?(self)
    appropriate_time = competition.in_progress? || competition.is_probably_over?
    appropriate_role && appropriate_time && !competition.results_posted?
  end

  def can_create_poll?
    admin? || board_member? || wrc_team? || wdc_team? || quality_assurance_committee?
  end

  def can_vote_in_poll?
    any_kind_of_delegate?
  end

  def can_view_poll?
    can_create_poll? || can_vote_in_poll?
  end

  def can_view_delegate_matters?
    any_kind_of_delegate? || can_admin_results? || wrc_team? || wdc_team? || quality_assurance_committee? || competition_announcement_team?
  end

  def can_manage_incidents?
    admin? || wrc_team?
  end

  def can_view_incident_private_sections?(incident)
    if incident.resolved?
      can_view_delegate_matters?
    else
      can_manage_incidents?
    end
  end

  def can_view_delegate_report?(delegate_report)
    if delegate_report.posted?
      can_view_delegate_matters?
    else
      delegate_report.competition.delegates.include?(self) || can_admin_results?
    end
  end

  def can_edit_delegate_report?(delegate_report)
    competition = delegate_report.competition
    can_admin_results? || (competition.delegates.include?(self) && !delegate_report.posted?)
  end

  def can_see_admin_competitions?
    can_admin_competitions? || senior_delegate? || quality_assurance_committee?
  end

  def can_approve_media?
    admin? || communication_team?
  end

  def can_see_eligible_voters?
    can_admin_results? || team_leader?(Team.wec)
  end

  def get_cannot_delete_competition_reason(competition)
    # Only allow results admins and competition delegates to delete competitions.
    if !can_manage_competition?(competition)
      I18n.t('competitions.errors.cannot_manage')
    elsif competition.showAtAll
      I18n.t('competitions.errors.cannot_delete_public')
    elsif competition.confirmed? && !self.can_admin_results?
      I18n.t('competitions.errors.cannot_delete_confirmed')
    else
      nil
    end
  end

  # Note this is very similar to the cannot_be_assigned_to_user_reasons method in person.rb.
  def cannot_register_for_competition_reasons
    [].tap do |reasons|
      reasons << I18n.t('registrations.errors.need_name') if name.blank?
      reasons << I18n.t('registrations.errors.need_gender') if gender.blank?
      reasons << I18n.t('registrations.errors.need_dob') if dob.blank?
      reasons << I18n.t('registrations.errors.need_country') if country_iso2.blank?
    end
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
  ].freeze

  def editable_fields_of_user(user)
    fields = Set.new
    if user.dummy_account?
      # That's the only field we want to be able to edit for these accounts
      return %i(remove_avatar)
    end
    if user == self
      fields += %i(
        current_password password password_confirmation
        email preferred_events results_notifications_enabled
      )
      fields << { user_preferred_events_attributes: [:id, :event_id, :_destroy] }
      if user.staff?
        fields += %i(receive_delegate_reports)
      end
    end
    if admin? || board_member? || senior_delegate?
      fields += %i(delegate_status senior_delegate_id region)
    end
    if user.any_kind_of_delegate?
      if user == self
        fields += %i(location_description phone_number)
      end
      if self.can_edit_notes_of_user?(user)
        fields += %i(notes)
      end
    end
    if admin? || any_kind_of_delegate?
      fields += %i(
        wca_id unconfirmed_wca_id
        avatar avatar_cache
      )
    end
    if user == self || admin? || any_kind_of_delegate? || results_team?
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

  def self.clear_receive_delegate_reports_if_not_staff
    User.where(receive_delegate_reports: true).reject(&:staff?).map { |u| u.update(receive_delegate_reports: false) }
  end

  # This method is only called in sync_mailing_lists_job.rb, right after clear_receive_delegate_reports_if_not_staff.
  # If used without calling clear_receive_delegate_reports_if_not_staff it might return non-current Staff members.
  # The reason why clear_receive_delegate_reports_if_not_staff is needed is because there's no automatic code that
  # runs once a user is no longer a team member, we just schedule their end date.
  def self.delegate_reports_receivers_emails
    candidate_delegates = User.candidate_delegates
    other_staff = User.where(receive_delegate_reports: true)
    (%w(
      seniors@worldcubeassociation.org
      quality@worldcubeassociation.org
      regulations@worldcubeassociation.org
    ) + candidate_delegates.map(&:email) + other_staff.map(&:email)).uniq
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
    login = conditions.delete(:login)
    if login
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
      saved_pending_avatar_crop_x: nil, saved_pending_avatar_crop_y: nil, saved_pending_avatar_crop_w: nil, saved_pending_avatar_crop_h: nil
    )
  end

  def self.search(query, params: {})
    users = Person.includes(:user).current
    unless ActiveRecord::Type::Boolean.new.cast(params[:persons_table])
      users = User.confirmed_email.not_dummy_account

      if ActiveRecord::Type::Boolean.new.cast(params[:only_delegates])
        users = users.where.not(delegate_status: nil)
      end

      if ActiveRecord::Type::Boolean.new.cast(params[:only_with_wca_ids])
        users = users.where.not(wca_id: nil)
      end
    end

    query.split.each do |part|
      users = users.where("name LIKE :part OR wca_id LIKE :part", part: "%#{part}%")
    end

    users.order(:name)
  end

  def serializable_hash(options = nil)
    json = {
      class: self.class.to_s.downcase,
      url: self.wca_id ? Rails.application.routes.url_helpers.person_url(self.wca_id, host: ENVied.ROOT_URL) : "",

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

    # Private attributes to include.
    private_attributes = options&.fetch(:private_attributes, []) || []
    if private_attributes.include?("dob")
      json[:dob] = self.dob
    end

    if private_attributes.include?("email")
      json[:email] = self.email
    end

    # Delegates's emails and regions are public information.
    if self.any_kind_of_delegate?
      json[:email] = self.email
      json[:region] = self.region
      json[:senior_delegate_id] = self.senior_delegate_id
    end

    json
  end

  def to_wcif(competition, registration = nil, registrant_id = nil)
    person_pb = [person&.ranksAverage, person&.ranksSingle].compact.flatten
    roles = registration&.roles || []
    roles << "delegate" if competition.delegates.include?(self)
    roles << "organizer" if competition.organizers.include?(self)
    {
      "name" => name,
      "wcaUserId" => id,
      "wcaId" => wca_id,
      "registrantId" => registrant_id,
      "countryIso2" => country_iso2,
      "gender" => gender,
      # /wcif is restricted to users who can manage the competition,
      # we can include private data
      "birthdate" => dob.to_s,
      "email" => email,
      "registration" => registration&.to_wcif,
      "avatar" => {
        "url" => avatar.url,
        "thumbUrl" => avatar.url(:thumb),
      },
      "roles" => roles,
      "assignments" => registration&.assignments&.map(&:to_wcif) || [],
      "personalBests" => person_pb.map(&:to_wcif),
    }
  end

  def self.wcif_json_schema
    {
      "type" => "object",
      "properties" => {
        "registrantId" => { "type" => ["integer", "null"] }, # Note: for now registrantId may be null if the person doesn't compete.
        "name" => { "type" => "string" },
        "wcaUserId" => { "type" => "integer" },
        "wcaId" => { "type" => ["string", "null"] },
        "countryIso2" => { "type" => "string" },
        "gender" => { "type" => "string", "enum" => %w(m f o) },
        "birthdate" => { "type" => "string" },
        "email" => { "type" => "string" },
        "avatar" => {
          "type" => ["object", "null"],
          "properties" => {
            "url" => { "type" => "string" },
            "thumbUrl" => { "type" => "string" },
          },
        },
        "roles" => { "type" => "array", "items" => { "type" => "string" } },
        "registration" => Registration.wcif_json_schema,
        "assignments" => { "type" => "array", "items" => Assignment.wcif_json_schema },
        "personalBests" => { "type" => "array", "items" => PersonalBest.wcif_json_schema },
      },
    }
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

  # This is subtle. We don't want to leak birthdate when users claim a WCA ID that is not theirs.
  # See "does not leak birthdate information" test in spec/features/sign_up_spec.rb.
  def clean_up_passwords
    self.dob = nil
    super
  end

  # Overrides https://github.com/plataformatec/devise/blob/8266e8557622c978e6927a635d62e245bf54f239/lib/devise/models/validatable.rb#L64-L66
  def email_required?
    !dummy_account?
  end

  # A locked account is just a user with an empty password.
  # It's impossible to sign into an account with an empty password,
  # so the only way to log into a locked account is to reset its password.
  def self.new_locked_account(attributes = {})
    User.new(attributes.merge(encrypted_password: "")).tap do |user|
      user.define_singleton_method(:password_required?) { false } # More on that: https://stackoverflow.com/a/45589123
      user.skip_confirmation!
    end
  end

  # This method is called by Devise when a new user signs up.
  # This gives us an opportunity to stash the user's preferred locale in the
  # database, which is useful for when we send them emails in the future.
  def self.new_with_session(params, session)
    super.tap do |user|
      user.preferred_locale = session[:locale]
    end
  end
end
