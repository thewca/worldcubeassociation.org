# frozen_string_literal: true

require "uri"
require "fileutils"

class User < ApplicationRecord
  has_many :competition_delegates, foreign_key: "delegate_id"
  # This gives all the competitions where the user is marked as a Delegate,
  # regardless of the competition's status.
  has_many :delegated_competitions, through: :competition_delegates, source: "competition"
  # This gives all the competitions which actually happened and where the user
  # was a Delegate.
  has_many :actually_delegated_competitions, -> { over.visible.not_cancelled }, through: :competition_delegates, source: "competition"
  has_many :competition_organizers, foreign_key: "organizer_id"
  has_many :organized_competitions, through: :competition_organizers, source: "competition"
  has_many :votes
  has_many :registrations
  has_many :competitions_registered_for, through: :registrations, source: "competition"
  belongs_to :person, -> { current }, primary_key: "wca_id", foreign_key: "wca_id", optional: true
  belongs_to :unconfirmed_person, -> { current }, primary_key: "wca_id", foreign_key: "unconfirmed_wca_id", class_name: "Person", optional: true
  belongs_to :delegate_to_handle_wca_id_claim, foreign_key: "delegate_id_to_handle_wca_id_claim", class_name: "User", optional: true
  belongs_to :region, class_name: "UserGroup", optional: true
  has_many :roles, class_name: "UserRole"
  has_many :active_roles, -> { active }, class_name: "UserRole"
  has_many :past_roles, -> { inactive }, class_name: "UserRole"
  has_many :delegate_role_metadata, through: :active_roles, source: :metadata, source_type: "RolesMetadataDelegateRegions"
  has_many :delegate_roles, -> { includes(:group, :metadata) }, through: :delegate_role_metadata, source: :user_role, class_name: "UserRole"
  has_many :delegate_region_groups, through: :delegate_roles, source: :group, class_name: "UserGroup"
  has_many :delegate_regions, through: :delegate_region_groups, source: :metadata, source_type: "GroupsMetadataDelegateRegions"
  has_many :teams_committees_role_metadata, through: :active_roles, source: :metadata, source_type: "RolesMetadataTeamsCommittees"
  has_many :teams_committees_roles, through: :teams_committees_role_metadata, source: :user_role, class_name: "UserRole"
  has_many :teams_committees_groups, through: :teams_committees_roles, source: :group, class_name: "UserGroup"
  has_many :teams_committees, through: :teams_committees_groups, source: :metadata, source_type: "GroupsMetadataTeamsCommittees"
  has_many :teams_committees_at_least_senior_role_metadata, -> { at_least_senior_member }, through: :active_roles, source: :metadata, source_type: "RolesMetadataTeamsCommittees"
  has_many :teams_committees_at_least_senior_roles, through: :teams_committees_at_least_senior_role_metadata, source: :user_role, class_name: "UserRole"
  has_many :teams_committees_at_least_senior_groups, through: :teams_committees_at_least_senior_roles, source: :group, class_name: "UserGroup"
  has_many :teams_committees_at_least_senior, through: :teams_committees_at_least_senior_groups, source: :metadata, source_type: "GroupsMetadataTeamsCommittees"
  has_many :past_bans_metadata, through: :past_roles, source: :metadata, source_type: "RolesMetadataBannedCompetitors"
  has_many :past_bans, through: :past_bans_metadata, source: :user_role, class_name: "UserRole"
  has_many :active_bans_metadata, through: :active_roles, source: :metadata, source_type: "RolesMetadataBannedCompetitors"
  has_many :active_bans, through: :active_bans_metadata, source: :user_role, class_name: "UserRole"
  has_many :active_groups, through: :active_roles, source: :group, class_name: "UserGroup"
  has_many :board_metadata, through: :active_groups, source: :metadata, source_type: "GroupsMetadataBoard"
  has_many :confirmed_users_claiming_wca_id, -> { confirmed_email }, foreign_key: "delegate_id_to_handle_wca_id_claim", class_name: "User"
  has_many :oauth_applications, class_name: 'Doorkeeper::Application', as: :owner
  has_many :oauth_access_grants, class_name: 'Doorkeeper::AccessGrant', foreign_key: :resource_owner_id
  has_many :user_preferred_events, dependent: :destroy
  has_many :preferred_events, through: :user_preferred_events, source: :event
  has_many :bookmarked_competitions, dependent: :destroy
  has_many :competitions_bookmarked, through: :bookmarked_competitions, source: :competition
  has_many :competitions_announced, foreign_key: "announced_by", class_name: "Competition"
  has_many :competitions_results_posted, foreign_key: "results_posted_by", class_name: "Competition"
  has_many :confirmed_payment_intents, class_name: "PaymentIntent", as: :confirmation_source
  has_many :canceled_payment_intents, class_name: "PaymentIntent", as: :cancellation_source
  has_many :ranks_single, through: :person
  has_many :ranks_average, through: :person
  has_one :wfc_dues_redirect, as: :redirect_source
  belongs_to :delegate_reports_region, polymorphic: true, optional: true
  belongs_to :current_avatar, class_name: "UserAvatar", inverse_of: :current_user, optional: true
  belongs_to :pending_avatar, class_name: "UserAvatar", inverse_of: :pending_user, optional: true
  has_many :user_avatars, dependent: :destroy, inverse_of: :user
  has_many :potential_duplicate_persons, dependent: :destroy, foreign_key: :original_user_id, class_name: "PotentialDuplicatePerson"

  scope :confirmed_email, -> { where.not(confirmed_at: nil) }
  scope :newcomers, -> { where(wca_id: nil) }
  scope :newcomer_month_eligible, -> { newcomers.or(where('wca_id LIKE ?', "#{Time.current.year}%")) }

  scope :in_region, lambda { |region_id|
    where(country_iso2: Continent.country_iso2s(region_id) || Country.c_find(region_id)&.iso2) unless region_id.blank? || region_id == 'all'
  }

  ANONYMOUS_ACCOUNT_EMAIL_ID_SUFFIX = '@worldcubeassociation.org'
  ANONYMOUS_NAME = 'Anonymous'
  ANONYMOUS_DOB = '1954-12-04'
  ANONYMOUS_GENDER = 'o'
  ANONYMOUS_COUNTRY_ISO2 = 'US'

  FORUM_AGE_REQUIREMENT = 13

  def self.eligible_voters
    [
      UserGroup.delegate_regions,
      UserGroup.teams_committees,
      UserGroup.board,
      UserGroup.officers,
    ].flatten.flat_map(&:active_roles)
      .select(&:eligible_voter?)
      .map(&:user)
      .uniq
  end

  def self.leader_senior_voters
    team_leaders = RolesMetadataTeamsCommittees.leader.includes(:user, :user_role).select { |role_metadata| role_metadata.user_role.active? }.map(&:user)
    senior_delegates = RolesMetadataDelegateRegions.senior_delegate.includes(:user, :user_role).select { |role_metadata| role_metadata.user_role.active? }.map(&:user)
    (team_leaders + senior_delegates).uniq.compact
  end

  def self.regional_voters
    RolesMetadataDelegateRegions.regional_delegate.joins(:user_role).merge(UserRole.active).includes(:user).map(&:user).uniq.compact
  end

  def self.all_discourse_groups
    UserGroup.teams_committees.map { |x| x.metadata.friendly_id } + UserGroup.councils.map { |x| x.metadata.friendly_id } + RolesMetadataDelegateRegions.statuses.values + [UserGroup.group_types[:board]]
  end

  accepts_nested_attributes_for :user_preferred_events, allow_destroy: true

  strip_attributes only: %i[wca_id country_iso2]

  devise :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :confirmable
  devise :two_factor_authenticatable,
         otp_secret_encryption_key: AppSecrets.OTP_ENCRYPTION_KEY
  BACKUP_CODES_LENGTH = 8
  NUMBER_OF_BACKUP_CODES = 10
  devise :two_factor_backupable,
         # The parameter `otp_backup_code_length` represents the number of random bytes that should be generated.
         #   In order to achieve alphanumeric strings of length n, we need to generate n/2 random bytes.
         otp_backup_code_length: (BACKUP_CODES_LENGTH / 2),
         otp_number_of_backup_codes: NUMBER_OF_BACKUP_CODES

  # Backup OTP are stored as a string array in the db
  serialize :otp_backup_codes, coder: YAML

  def two_factor_enabled?
    otp_required_for_login
  end

  # When creating an account, we actually don't mind if the user leaves their
  # name empty, so long as they're a returning competitor and are claiming their
  # wca id.
  validates :name, presence: true, if: -> { !claiming_wca_id }
  WCA_ID_RE = /\A[1-9][[:digit:]]{3}[[:upper:]]{4}[[:digit:]]{2}\z/
  validates :wca_id, format: { with: WCA_ID_RE }, allow_nil: true
  validates :unconfirmed_wca_id, format: { with: WCA_ID_RE }, allow_nil: true
  WCA_ID_MAX_LENGTH = 10

  # Very simple (and permissive) regexp, the goal is just to avoid silly typo
  # like "aaa@bbb,com", or forgetting the '@'.
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }

  # Virtual attribute for authenticating by WCA ID or email.
  attr_accessor :login

  # Virtual attribute for remembering what the user clicked on when
  # signing up for an account.
  attr_accessor :sign_up_panel_to_show

  ALLOWABLE_GENDERS = %i[m f o].freeze
  enum :gender, ALLOWABLE_GENDERS.index_with(&:to_s)
  GENDER_LABEL_METHOD = lambda do |g|
    {
      m: I18n.t('enums.user.gender.m'),
      f: I18n.t('enums.user.gender.f'),
      o: I18n.t('enums.user.gender.o'),
    }[g]
  end

  validate :wca_id_is_unique_or_for_dummy_account
  def wca_id_is_unique_or_for_dummy_account
    return unless wca_id_change && wca_id

    user = User.find_by(wca_id: wca_id)
    # If there is a non dummy user with this WCA ID, fail validation.
    return unless user && !user.dummy_account?

    errors.add(
      :wca_id,
      I18n.t('users.errors.unique_html',
             used_name: user.name,
             used_email: user.email,
             used_edit_path: Rails.application.routes.url_helpers.edit_user_path(user)).html_safe,
    )
  end

  validate :name_must_match_person_name
  def name_must_match_person_name
    errors.add(:wca_id, I18n.t('users.errors.not_found')) if wca_id && !person
  end

  validate :check_if_email_used_by_locked_account, on: :create
  private def check_if_email_used_by_locked_account
    return unless User.find_by(email: email)&.locked_account?

    errors.delete(:email)
    errors.add(:email, I18n.t('users.errors.email_used_by_locked_account_html').html_safe)
  end

  validate do
    if dob && dob >= Date.today
      errors.add(:dob, I18n.t('users.errors.dob_past'))
    elsif dob && dob >= 2.years.ago
      errors.add(:dob, I18n.t('users.errors.dob_recent'))
    end
  end

  attr_reader :claiming_wca_id

  def claiming_wca_id=(claiming_wca_id)
    @claiming_wca_id = ActiveRecord::Type::Boolean.new.cast(claiming_wca_id)
  end

  before_validation :maybe_clear_claimed_wca_id
  def maybe_clear_claimed_wca_id
    return unless !claiming_wca_id && ((unconfirmed_wca_id_was.present? && wca_id == unconfirmed_wca_id_was) || unconfirmed_wca_id.blank?)

    self.unconfirmed_wca_id = nil
    self.delegate_to_handle_wca_id_claim = nil
  end

  # Virtual attribute for people claiming a WCA ID.
  attr_accessor :dob_verification
  attr_accessor :current_user, :was_incorrect_wca_id_claim

  MAX_INCORRECT_WCA_ID_CLAIM_COUNT = 5
  validate :claim_wca_id_validations
  def claim_wca_id_validations # rubocop:disable Metrics/CyclomaticComplexity,Metrics/PerceivedComplexity
    self.was_incorrect_wca_id_claim = false
    already_assigned_to_user = false
    if unconfirmed_wca_id.present?
      already_assigned_to_user = unconfirmed_person&.user && !unconfirmed_person.user.dummy_account?
      if !unconfirmed_person
        errors.add(:unconfirmed_wca_id, I18n.t('users.errors.not_found'))
      elsif already_assigned_to_user
        errors.add(:unconfirmed_wca_id, I18n.t('users.errors.already_assigned'))
      end
    end

    return unless claiming_wca_id || (unconfirmed_wca_id.present? && unconfirmed_wca_id_change)

    errors.add(:delegate_id_to_handle_wca_id_claim, I18n.t('simple_form.required.text')) if delegate_id_to_handle_wca_id_claim.blank?

    errors.add(:unconfirmed_wca_id, I18n.t('simple_form.required.text')) if unconfirmed_wca_id.blank?

    dob_verification_date = Date.safe_parse(dob_verification, nil)
    if unconfirmed_person && (!current_user || !current_user.can_view_all_users?)
      dob_form_path = Rails.application.routes.url_helpers.contact_dob_path
      wrt_contact_path = Rails.application.routes.url_helpers.contact_path(contactRecipient: 'wrt')
      remaining_wca_id_claims = [0, MAX_INCORRECT_WCA_ID_CLAIM_COUNT - unconfirmed_person.incorrect_wca_id_claim_count].max
      if remaining_wca_id_claims.zero? || !unconfirmed_person.dob
        errors.add(:dob_verification, I18n.t('users.errors.wca_id_no_birthdate_html', dob_form_path: dob_form_path).html_safe)
      elsif unconfirmed_person.gender.blank?
        errors.add(:gender, I18n.t('users.errors.wca_id_no_gender_html', wrt_contact_path: wrt_contact_path).html_safe)
      elsif !already_assigned_to_user && unconfirmed_person.dob != dob_verification_date
        # Note that we don't verify DOB for WCA IDs that have already been
        # claimed. This protects people from DOB guessing attacks.
        self.was_incorrect_wca_id_claim = true
        errors.add(:dob_verification, I18n.t('users.errors.dob_incorrect_html', dob_form_path: dob_form_path).html_safe)
      end
    end
    errors.add(:unconfirmed_wca_id, I18n.t('users.errors.already_have_id', wca_id: wca_id)) if claiming_wca_id && person

    errors.add(:delegate_id_to_handle_wca_id_claim, I18n.t('users.errors.not_found')) if delegate_id_to_handle_wca_id_claim.present? && !delegate_to_handle_wca_id_claim&.any_kind_of_delegate?
  end

  # workaround / very nasty hotfix for Rails 6 issue with rollback triggers.
  # TODO: remove once https://github.com/rails/rails/issues/36965 is fixed.
  after_validation do
    # we have to do _some_ non-zero modifications to the model, otherwise after_rollback won't trigger
    self.touch if self.claiming_wca_id && self.was_incorrect_wca_id_claim && persisted? && !destroyed?
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

  before_validation :copy_data_from_persons
  def copy_data_from_persons
    # NOTE: copy data from the person only if the WCA ID has already been claimed
    # or the user claims this WCA ID.
    # Otherwise (when setting WCA ID directly) we want to validate
    # that the user details matches the person details instead.
    p = (wca_id_was.present? && person) || unconfirmed_person
    return unless p

    self.name = p.name
    self.dob = p.dob
    self.gender = p.gender
    self.country_iso2 = p.country_iso2
  end

  validate :must_look_like_the_corresponding_person
  private def must_look_like_the_corresponding_person
    return unless person

    errors.add(:name, I18n.t("users.errors.must_match_person")) if self.name != person.name
    errors.add(:country_iso2, I18n.t("users.errors.must_match_person")) if self.country_iso2 != person.country_iso2
    errors.add(:gender, I18n.t("users.errors.must_match_person")) if self.gender != person.gender
    errors.add(:dob, I18n.t("users.errors.must_match_person")) if self.dob != person.dob
  end

  before_validation :strip_name
  def strip_name
    self.name = self.name.strip if self.name.present?
  end

  validate :wca_id_prereqs
  def wca_id_prereqs
    p = person || unconfirmed_person
    return unless p

    cannot_be_assigned_reasons = p.cannot_be_assigned_to_user_reasons
    errors.add(:wca_id, cannot_be_assigned_reasons.xss_aware_to_sentence) unless cannot_be_assigned_reasons.empty?
  end

  # To handle profile pictures that predate our user account system, we created
  # a bunch of dummy accounts (accounts with no password). When someone finally
  # claims their WCA ID, we want to delete the dummy account and copy over their
  # avatar.
  before_save :remove_dummy_account_and_copy_name_when_wca_id_changed
  def remove_dummy_account_and_copy_name_when_wca_id_changed
    return unless wca_id_change && wca_id.present?

    dummy_user = User.find_by(wca_id: wca_id, dummy_account: true)
    return unless dummy_user

    # Transfer current and pending avatar associations
    self.current_avatar = dummy_user.current_avatar
    self.pending_avatar = dummy_user.pending_avatar

    # Transfer historic avatars
    self.user_avatars = dummy_user.user_avatars

    # The `reload` is necessary because otherwise, the old pre-reload `user_avatars`
    # association on `dummy_user` would pull the avatars to the grave.
    dummy_user.reload.destroy!
  end

  def avatar
    self.current_avatar || UserAvatar.default_avatar(self)
  end

  def avatar_history
    user_avatars.not_pending.order(created_at: :desc)
  end

  # Convenience method for Discord SSO, because we need to maintain backwards compatibility
  delegate :url, to: :avatar, prefix: true

  # This method was copied and overridden from https://github.com/plataformatec/devise/blob/master/lib/devise/models/confirmable.rb#L182
  # to enable separate emails for sign-up and email reconfirmation
  def send_on_create_confirmation_instructions
    NewRegistrationMailer.send_registration_mail(self).deliver_now
  end

  # After the user confirms their account, if they claimed a WCA ID, now is the
  # time to notify their delegate!
  def after_confirmation
    WcaIdClaimMailer.notify_delegate_of_wca_id_claim(self).deliver_later if unconfirmed_wca_id.present?
  end

  # For associated_events_picker
  def events_to_associated_events(events)
    events.map do |event|
      user_preferred_events.find_by(event_id: event.id) || user_preferred_events.build(event_id: event.id)
    end
  end

  def country
    Country.c_find_by_iso2(country_iso2)
  end

  def newcomer_month_eligible?
    person.nil? || wca_id.start_with?(Time.current.year.to_s)
  end

  def locale
    preferred_locale || I18n.default_locale
  end

  private def group_member?(group)
    active_roles.any? { |role| role.group_id == group.id }
  end

  private def at_least_senior_teams_committees_member?(group)
    teams_committees_at_least_senior_roles.exists?(group_id: group.id)
  end

  private def group_leader?(group)
    group.lead_user == self
  end

  def board_member?
    group_member?(UserGroup.board_group)
  end

  def communication_team?
    group_member?(UserGroup.teams_committees_group_wct)
  end

  def competition_announcement_team?
    group_member?(UserGroup.teams_committees_group_wcat)
  end

  def wic_team?
    group_member?(UserGroup.teams_committees_group_wic)
  end

  def weat_team?
    group_member?(UserGroup.teams_committees_group_weat)
  end

  def financial_committee?
    group_member?(UserGroup.teams_committees_group_wfc)
  end

  def marketing_team?
    group_member?(UserGroup.teams_committees_group_wmt)
  end

  def quality_assurance_committee?
    group_member?(UserGroup.teams_committees_group_wqac)
  end

  def wrc_team?
    group_member?(UserGroup.teams_committees_group_wrc)
  end

  def results_team?
    group_member?(UserGroup.teams_committees_group_wrt)
  end

  def appeals_committee?
    group_member?(UserGroup.teams_committees_group_wapc)
  end

  private def senior_results_team?
    at_least_senior_teams_committees_member?(UserGroup.teams_committees_group_wrt)
  end

  private def software_team?
    group_member?(UserGroup.teams_committees_group_wst)
  end

  private def software_team_admin?
    active_roles.any? { |role| role.group == UserGroup.teams_committees_group_wst_admin }
  end

  def staff?
    active_roles.any?(&:staff?)
  end

  def admin?
    Rails.env.production? && EnvConfig.WCA_LIVE_SITE? ? software_team_admin? : (software_team? || software_team_admin?)
  end

  def can_administrate_livestream?
    software_team? || board_member? || communication_team?
  end

  def any_kind_of_delegate?
    delegate_role_metadata.any?
  end

  def trainee_delegate?
    # NOTE: `delegate_role_metadata.trainee_delegate.any?`, does fire a db query
    # even if the `delegate_role_metadata` is eager loaded (because rails
    # really wants to translate it to a "select 1 ..."; therefore we use a
    # different implementation when we explicitly eager load roles.
    if delegate_role_metadata.loaded?
      delegate_role_metadata.any?(&:trainee_delegate?)
    else
      delegate_role_metadata.trainee_delegate.any?
    end
  end

  private def staff_delegate?
    any_kind_of_delegate? && !trainee_delegate?
  end

  def senior_delegate?
    senior_delegate_roles.any?
  end

  def regional_delegate?
    regional_delegate_roles.any?
  end

  def staff_or_any_delegate?
    staff? || any_kind_of_delegate?
  end

  def senior_delegate_for?(user)
    user.senior_delegates.include?(self)
  end

  def below_forum_age_requirement?
    (Date.today - FORUM_AGE_REQUIREMENT.years) < dob
  end

  def forum_banned?
    current_ban&.metadata&.scope == 'competing_and_attending_and_forums'
  end

  def banned?
    group_member?(UserGroup.banned_competitors.first)
  end

  def banned_in_past?
    past_bans.any?
  end

  def current_ban
    active_bans.first
  end

  def ban_end
    current_ban&.end_date
  end

  def banned_at_date?(date)
    if banned?
      ban_end.blank? || date < ban_end
    else
      false
    end
  end

  private def can_edit_any_groups?
    admin? || board_member? || results_team?
  end

  private def groups_with_create_access
    # Currently, only Delegate Region groups can be created using API.
    can_edit_any_groups? ? [UserGroup.group_types[:delegate_regions]] : []
  end

  private def senior_delegate_roles
    delegate_roles.select { |role| role.metadata.status == RolesMetadataDelegateRegions.statuses[:senior_delegate] }
  end

  private def regional_delegate_roles
    delegate_roles.select { |role| role.metadata.status == RolesMetadataDelegateRegions.statuses[:regional_delegate] }
  end

  private def can_view_current_banned_competitors?
    can_view_past_banned_competitors? || staff_delegate? || appeals_committee?
  end

  private def can_view_delegate_probations?
    wic_team?
  end

  private def can_view_past_banned_competitors?
    wic_team? || board_member? || weat_team? || results_team? || admin?
  end

  private def groups_with_read_access_for_current
    return "*" if can_edit_any_groups?

    groups = groups_with_read_access_for_past

    groups += UserGroup.banned_competitors.ids if can_view_current_banned_competitors?

    groups
  end

  private def groups_with_read_access_for_past
    return "*" if can_edit_any_groups?

    groups = groups_with_edit_access

    groups += UserGroup.banned_competitors.ids if can_view_past_banned_competitors?

    groups += UserGroup.delegate_probation.ids if can_view_delegate_probations?

    groups
  end

  private def groups_with_edit_access
    return "*" if can_edit_any_groups?

    groups = []

    active_roles.select do |role|
      group = role.group
      group_type = role.group_type
      if [UserGroup.group_types[:councils], UserGroup.group_types[:teams_committees]].include?(group_type)
        groups << group.id if role.lead?
      elsif group_type == UserGroup.group_types[:delegate_regions]
        groups += [group.id, group.all_child_groups.map(&:id)].flatten.uniq if role.lead? && role.metadata.status == RolesMetadataDelegateRegions.statuses[:senior_delegate]
      end
    end

    groups += UserGroup.delegate_probation.ids if can_manage_delegate_probation?

    groups << UserGroup.translators.ids if software_team?

    groups += UserGroup.banned_competitors.ids if can_edit_banned_competitors?

    groups
  end

  def self.panel_pages
    %i[
      postingDashboard
      editPerson
      regionsManager
      groupsManagerAdmin
      bannedCompetitors
      translators
      duesExport
      countryBands
      delegateProbations
      xeroUsers
      duesRedirect
      delegateForms
      regions
      subordinateDelegateClaims
      subordinateUpcomingCompetitions
      leaderForms
      groupsManager
      importantLinks
      seniorDelegatesList
      leadersAdmin
      boardEditor
      officersEditor
      regionsAdmin
      downloadVoters
      generateDbToken
      approveAvatars
      editPersonRequests
      anonymizationScript
      serverStatus
      runValidators
      createNewComers
      checkRecords
      computeAuxiliaryData
      generateDataExports
      fixResults
      mergeProfiles
      mergeUsers
      helpfulQueries
    ].index_with { |panel_page| panel_page.to_s.underscore.dasherize }
  end

  def self.panel_notifications
    {
      self.panel_pages[:approveAvatars] => -> { User.where.not(pending_avatar: nil).count },
    }
  end

  def self.panel_list
    panel_pages = User.panel_pages
    {
      admin: {
        name: 'Admin panel',
        pages: panel_pages.values,
      },
      volunteer: {
        name: 'Volunteer panel',
        pages: [],
      },
      delegate: {
        name: 'Delegate panel',
        pages: [
          panel_pages[:importantLinks],
          panel_pages[:bannedCompetitors],
        ],
      },
      wapc: {
        name: 'WAC panel',
        pages: [
          panel_pages[:bannedCompetitors],
        ],
      },
      wfc: {
        name: 'WFC panel',
        pages: [
          panel_pages[:duesExport],
          panel_pages[:countryBands],
          panel_pages[:xeroUsers],
          panel_pages[:duesRedirect],
          panel_pages[:delegateProbations],
        ],
      },
      wrt: {
        name: 'WRT panel',
        pages: [
          panel_pages[:postingDashboard],
          panel_pages[:editPersonRequests],
          panel_pages[:editPerson],
          panel_pages[:approveAvatars],
          panel_pages[:anonymizationScript],
          panel_pages[:runValidators],
          panel_pages[:createNewComers],
          panel_pages[:checkRecords],
          panel_pages[:computeAuxiliaryData],
          panel_pages[:generateDataExports],
          panel_pages[:fixResults],
          panel_pages[:mergeProfiles],
          panel_pages[:mergeUsers],
          panel_pages[:helpfulQueries],
        ],
      },
      wst: {
        name: 'WST panel',
        pages: [
          panel_pages[:translators],
          panel_pages[:serverStatus],
        ],
      },
      board: {
        name: 'Board panel',
        pages: [
          panel_pages[:seniorDelegatesList],
          panel_pages[:leadersAdmin],
          panel_pages[:regionsManager],
          panel_pages[:delegateProbations],
          panel_pages[:groupsManagerAdmin],
          panel_pages[:boardEditor],
          panel_pages[:officersEditor],
          panel_pages[:regionsAdmin],
          panel_pages[:bannedCompetitors],
          panel_pages[:downloadVoters],
        ],
      },
      leader: {
        name: 'Leader panel',
        pages: [
          panel_pages[:leaderForms],
          panel_pages[:groupsManager],
        ],
      },
      senior_delegate: {
        name: 'Senior Delegate panel',
        pages: [
          panel_pages[:delegateForms],
          panel_pages[:regions],
          panel_pages[:delegateProbations],
          panel_pages[:subordinateDelegateClaims],
          panel_pages[:subordinateUpcomingCompetitions],
        ],
      },
      wic: {
        name: 'WIC panel',
        pages: [
          panel_pages[:downloadVoters],
          panel_pages[:bannedCompetitors],
          panel_pages[:delegateProbations],
          panel_pages[:helpfulQueries],
        ],
      },
      weat: {
        name: 'WEAT panel',
        pages: [
          panel_pages[:bannedCompetitors],
          panel_pages[:delegateProbations],
        ],
      },
    }
  end

  def panels_with_access
    User.panel_list.keys.select { |panel_id| can_access_panel?(panel_id) }
  end

  def permissions
    permissions = {
      can_attend_competitions: {
        scope: cannot_register_for_competition_reasons.empty? ? "*" : [],
      },
      can_organize_competitions: {
        scope: can_create_competitions? && cannot_organize_competition_reasons.empty? ? "*" : [],
      },
      can_administer_competitions: {
        scope: can_admin_competitions? ? "*" : delegated_competition_ids + organized_competition_ids,
      },
      can_view_delegate_admin_page: {
        scope: can_view_delegate_matters? ? "*" : [],
      },
      can_view_delegate_report: {
        scope: can_view_delegate_matters? ? "*" : delegated_competition_ids,
      },
      can_edit_delegate_report: {
        scope: can_admin_results? ? "*" : delegated_competition_ids,
      },
      can_create_groups: {
        scope: groups_with_create_access,
      },
      can_read_groups_current: {
        scope: groups_with_read_access_for_current,
      },
      can_read_groups_past: {
        scope: groups_with_read_access_for_past,
      },
      can_edit_groups: {
        scope: groups_with_edit_access,
      },
      can_access_panels: {
        scope: panels_with_access,
      },
      can_request_to_edit_others_profile: {
        scope: any_kind_of_delegate? ? "*" : [],
      },
    }
    if banned?
      permissions[:can_attend_competitions][:scope] = []
      permissions[:can_attend_competitions][:until] = ban_end || nil
    end
    permissions
  end

  def has_permission?(permission_name, scope = nil)
    permission = permissions[permission_name.to_sym]
    permission.present? && (permission[:scope] == "*" || permission[:scope].include?(scope))
  end

  def can_view_all_users?
    admin? || board_member? || results_team? || communication_team? || wic_team? || any_kind_of_delegate? || weat_team? || wrc_team? || appeals_committee?
  end

  def can_edit_user?(user)
    self == user || can_view_all_users? || organizer_for?(user)
  end

  def can_edit_any_user?
    admin? || any_kind_of_delegate? || results_team? || communication_team?
  end

  def can_change_users_avatar?(user)
    # We use the ability to `remove_avatar` as a general check for whether edits are allowed.
    #   Otherwise, checking for competitions of `current_avatar` and `pending_avatar` might be
    #   too cumbersome depending on the context (ie depending on where this method is being called from)
    # Note that the check for the user's WCA ID is technically not required. That is,
    #   we can perfectly link an avatar to a user who has not claimed any WCA ID. The true reason
    #   for this check is purely pragmatic: We've had issues with "unclaimed" user accounts
    #   (i.e. accounts that do not have a WCA ID) thinking that they are anonymous and uploading
    #   derogatory, racist or otherwise harmful material as pictures because they thought they
    #   would be "anonymous". With this requirement for a WCA ID, we can at least ban or otherwise
    #   punish users who exhibit such a highly concerning behavior.
    user.wca_id.present? && self.editable_fields_of_user(user).include?(:remove_avatar)
  end

  def organizer_for?(user)
    # If the user is a newcomer, allow organizers of the competition that the user is registered for to edit that user's name.
    user.competitions_registered_for.not_over.joins(:competition_organizers).pluck("competition_organizers.organizer_id").include?(self.id)
  end

  def can_admin_results?
    admin? || board_member? || results_team?
  end

  def can_admin_finances?
    admin? || financial_committee?
  end

  def can_edit_banned_competitors?
    can_edit_any_groups? || group_leader?(UserGroup.teams_committees_group_wic) || group_leader?(UserGroup.teams_committees_group_wapc)
  end

  def can_manage_regional_organizations?
    admin? || board_member? || weat_team?
  end

  def can_create_competitions?
    can_admin_results? || any_kind_of_delegate?
  end

  def can_create_posts?
    wic_team? || wrc_team? || communication_team? || can_announce_competitions?
  end

  def can_upload_images?
    can_create_posts? ||
      any_kind_of_delegate? || # Delegates are allowed to upload photos when writing a delegate report.
      can_manage_any_not_over_competitions? # Competition managers may want to upload photos to their competition tabs.
  end

  def can_admin_competitions?
    can_admin_results? || competition_announcement_team?
  end

  alias_method :can_announce_competitions?, :can_admin_competitions?

  def can_manage_competition?(competition)
    can_admin_competitions? ||
      competition.organizers.include?(self) ||
      competition.delegates.include?(self) ||
      competition.delegates.flat_map(&:senior_delegates).compact.include?(self) ||
      competition.delegates.flat_map(&:regional_delegates).compact.include?(self) ||
      wic_team?
  end

  def can_manage_any_not_over_competitions?
    delegated_competitions.not_over.present? || organized_competitions.not_over.present?
  end

  def can_view_hidden_competitions?
    can_admin_competitions? || any_kind_of_delegate?
  end

  def can_edit_registration?(registration)
    # A registration can be edited by a user if it hasn't been accepted yet, and if edits are allowed.
    editable_by_user = !registration.accepted? || registration.competition.registration_edits_currently_permitted?
    can_manage_competition?(registration.competition) || (registration.user_id == self.id && editable_by_user)
  end

  def can_confirm_competition?(competition)
    # We don't let competition organizers confirm competitions.
    can_admin_results? || competition.staff_delegates.include?(self)
  end

  def can_add_and_remove_events?(competition)
    can_admin_competitions? || (can_manage_competition?(competition) && !competition.confirmed?)
  end

  def can_update_events?(competition)
    can_admin_competitions? || (can_manage_competition?(competition) && !competition.results_posted?)
  end

  def can_update_qualifications?(competition)
    can_update_events?(competition) && competition.qualification_results? && competition.qualification_results_reason.present?
  end

  def can_update_competition_series?(competition)
    can_admin_competitions? || (can_manage_competition?(competition) && !competition.confirmed?)
  end

  def can_upload_competition_results?(competition)
    return false if competition.upcoming? || !competition.announced?

    can_admin_results? || (competition.delegates.include?(self) && !competition.results_posted?)
  end

  def can_submit_competition_results?(competition)
    can_upload_competition_results?(competition) && (can_admin_results? || competition.staff_delegates.include?(self))
  end

  def can_check_newcomers_data?(competition)
    competition.upcoming? && can_admin_results?
  end

  def can_create_poll?
    admin? || board_member? || wrc_team? || wic_team? || quality_assurance_committee?
  end

  def can_vote_in_poll?
    staff?
  end

  def can_view_poll?
    can_create_poll? || can_vote_in_poll?
  end

  def can_view_delegate_matters?
    any_kind_of_delegate? || can_admin_results? || wrc_team? || wic_team? || quality_assurance_committee? || competition_announcement_team? || weat_team? || communication_team? || financial_committee?
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
      can_edit_delegate_report?(delegate_report) || wic_team?
    end
  end

  def can_edit_delegate_report?(delegate_report)
    can_post_delegate_report?(delegate_report, edit_only: true)
  end

  def can_post_delegate_report?(delegate_report, edit_only: false)
    competition = delegate_report.competition
    allowed_delegate = if edit_only
                         competition.delegates.include?(self)
                       else
                         competition.staff_delegates.include?(self)
                       end
    can_admin_results? || (allowed_delegate && !delegate_report.posted?)
  end

  def can_see_admin_competitions?
    can_admin_competitions? || senior_delegate? || regional_delegate? || quality_assurance_committee? || weat_team?
  end

  def can_issue_refunds?(competition)
    competition.managers.include?(self) || admin?
  end

  def can_approve_media?
    admin? || communication_team? || board_member?
  end

  def can_see_eligible_voters?
    can_admin_results? || wic_team?
  end

  def get_cannot_delete_competition_reason(competition)
    # Only allow results admins and competition delegates to delete competitions.
    if !can_manage_competition?(competition)
      I18n.t('competitions.errors.cannot_manage')
    elsif competition.show_at_all?
      I18n.t('competitions.errors.cannot_delete_public')
    elsif competition.confirmed? && !self.can_admin_results?
      I18n.t('competitions.errors.cannot_delete_confirmed')
    end
  end

  # Note this is very similar to the cannot_be_assigned_to_user_reasons method in person.rb.
  # The competition parameter is there when you want to check if a (potentially banned)
  # competitor wants to register for a specific competition, not competitions in general
  def cannot_register_for_competition_reasons(competition = nil, is_competing: true)
    [].tap do |reasons|
      reasons << I18n.t('registrations.errors.need_name') if name.blank?
      reasons << I18n.t('registrations.errors.need_gender') if gender.blank?
      reasons << I18n.t('registrations.errors.need_dob') if dob.blank?
      reasons << I18n.t('registrations.errors.need_country') if country_iso2.blank?
      reasons << I18n.t('registrations.errors.banned_html').html_safe if is_competing && competition.present? && banned_at_date?(competition.start_date)
    end
  end

  def cannot_organize_competition_reasons
    [].tap do |reasons|
      reasons << I18n.t('registrations.errors.need_name') if name.blank?
      reasons << I18n.t('registrations.errors.need_gender') if gender.blank?
      reasons << I18n.t('registrations.errors.need_dob') if dob.blank?
      reasons << I18n.t('registrations.errors.need_country') if country_iso2.blank?
    end
  end

  def cannot_edit_data_reason_html(user_to_edit)
    return I18n.t('users.edit.cannot_edit.reason.no_access') unless user_to_edit == self || can_edit_any_user?

    # Don't allow editing data if they have a WCA ID assigned, or if they
    # have already registered for a competition. We do allow admins and delegates
    # who have registered for a competition to edit their own data.
    cannot_edit_reason = if user_to_edit.wca_id_was && user_to_edit.wca_id
                           # Not using _html suffix as automatic html_safe is available only from
                           # the view helper
                           I18n.t('users.edit.cannot_edit.reason.assigned')
                         elsif user_to_edit == self && !(admin? || any_kind_of_delegate?) && user_to_edit.registrations.accepted.any?
                           I18n.t('users.edit.cannot_edit.reason.registered')
                         end
    return unless cannot_edit_reason

    I18n.t('users.edit.cannot_edit.msg',
           reason: cannot_edit_reason,
           wrt_contact_path: Rails.application.routes.url_helpers.contact_path(contactRecipient: 'wrt'),
           delegate_url: Rails.application.routes.url_helpers.delegates_path).html_safe
  end

  CLAIM_WCA_ID_PARAMS = %i[
    claiming_wca_id
    unconfirmed_wca_id
    delegate_id_to_handle_wca_id_claim
    dob_verification
  ].freeze

  def editable_fields_of_user(user)
    fields = Set.new
    if user.dummy_account?
      # That's the only field we want to be able to edit for these accounts
      return %i[remove_avatar]
    end

    fields += editable_personal_preference_fields(user)
    fields += editable_competitor_info_fields(user)
    fields += editable_avatar_fields(user)
    fields
  end

  private def editable_personal_preference_fields(user)
    fields = Set.new
    if user == self
      fields += %i[
        password password_confirmation
        email preferred_events results_notifications_enabled
        registration_notifications_enabled
        receive_developer_mails
      ]
      fields << { user_preferred_events_attributes: [%i[id event_id _destroy]] }
      fields += %i[receive_delegate_reports delegate_reports_region] if user.staff_or_any_delegate?
    end
    fields
  end

  private def editable_competitor_info_fields(user)
    fields = Set.new
    fields += %i[name dob gender country_iso2] unless cannot_edit_data_reason_html(user)
    fields += CLAIM_WCA_ID_PARAMS if user == self || can_edit_any_user?
    fields << :name if user.wca_id.blank? && organizer_for?(user)
    if can_edit_any_user?
      fields += %i[
        unconfirmed_wca_id
      ]
      fields += %i[wca_id] unless user.special_account?
    end
    fields
  end

  private def editable_avatar_fields(user)
    fields = Set.new
    if user == self || admin? || results_team? || senior_delegate_for?(user)
      fields += %i[pending_avatar avatar_thumbnail remove_avatar]

      fields += %i[current_avatar] if can_admin_results?
    end
    fields
  end

  # This method is only called in sync_mailing_lists_job.rb, right before the actual sync takes place.
  #   We need this because otherwise, the syncing code might consider non-current eligible members.
  #   The reason why clear_receive_delegate_reports_if_not_eligible is needed is because there's no automatic code that
  #   runs once a user is no longer a team member; we just schedule their end date.
  def self.clear_receive_delegate_reports_if_not_eligible
    User.where(receive_delegate_reports: true).reject(&:staff_or_any_delegate?).map { |u| u.update(receive_delegate_reports: false) }
  end

  def self.delegate_reports_receivers_emails(report_region = nil)
    staff_receiver_emails = User.where(receive_delegate_reports: true, delegate_reports_region: report_region).pluck(:email).uniq
    additional_receiver_emails = report_region.nil? ? self.default_report_receivers : []

    (staff_receiver_emails + additional_receiver_emails).uniq
  end

  def self.default_report_receivers
    %w[
      seniors@worldcubeassociation.org
      quality@worldcubeassociation.org
      regulations@worldcubeassociation.org
    ]
  end

  def notify_of_results_posted(competition)
    CompetitionsMailer.notify_users_of_results_presence(self, competition).deliver_later if results_notifications_enabled?
  end

  def maybe_assign_wca_id_by_results(competition, notify: true)
    return unless !wca_id && !unconfirmed_wca_id

    matches = []
    matches = competition.competitors.where(name: name, dob: dob, gender: gender, country_id: country.id).to_a unless country.nil? || dob.nil?
    if matches.size == 1 && matches.first.user.nil?
      update(wca_id: matches.first.wca_id)
    elsif notify
      notify_of_id_claim_possibility(competition)
    end
  end

  def notify_of_id_claim_possibility(competition)
    CompetitionsMailer.notify_users_of_id_claim_possibility(self, competition).deliver_later if !wca_id && !unconfirmed_wca_id
  end

  def competition_bookmarked?(competition)
    BookmarkedCompetition.where(competition: competition, user: self).present?
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

  def self.staff_delegate_ids
    UserGroup
      .delegate_regions
      .flat_map(&:active_roles)
      .select(&:staff?)
      .map(&:user_id)
  end

  def self.trainee_delegate_ids
    UserGroup
      .delegate_regions
      .flat_map(&:active_roles)
      .select { |role| role.metadata.status == RolesMetadataDelegateRegions.statuses[:trainee_delegate] }
      .map(&:user_id)
  end

  def self.search(query, params: {})
    search_by_email = ActiveRecord::Type::Boolean.new.cast(params[:email])
    admin_search = ActiveRecord::Type::Boolean.new.cast(params[:adminSearch])
    searching_persons_table = ActiveRecord::Type::Boolean.new.cast(params[:persons_table])

    return User.where(email: query) if admin_search && search_by_email

    if searching_persons_table
      users = Person.includes(:user).current
      search_by_email = false # We can't search by email on the 'Person' table
    else
      users = User.confirmed_email.not_dummy_account

      users = users.where(id: self.staff_delegate_ids) if ActiveRecord::Type::Boolean.new.cast(params[:only_staff_delegates])

      users = users.where(id: self.trainee_delegate_ids) if ActiveRecord::Type::Boolean.new.cast(params[:only_trainee_delegates])

      users = users.where.not(wca_id: nil) if ActiveRecord::Type::Boolean.new.cast(params[:only_with_wca_ids])
    end

    query.split.each do |part|
      users = users.where("name LIKE :part OR wca_id LIKE :part #{'OR email LIKE :part' if search_by_email}", part: "%#{part}%")
    end

    users.order(:name)
  end

  def url
    if wca_id
      Rails.application.routes.url_helpers.person_url(wca_id, host: EnvConfig.ROOT_URL)
    else
      ""
    end
  end

  private def deprecated_team_roles
    active_roles
      .includes(:metadata, group: [:metadata])
      .select do |role|
        [
          UserGroup.group_types[:teams_committees],
          UserGroup.group_types[:councils],
          UserGroup.group_types[:board],
        ].include?(role.group_type)
      end
      .reject { |role| role.group.is_hidden }
      .map(&:deprecated_team_role)
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[id wca_id name gender
             country_iso2 created_at updated_at],
    methods: %w[url country],
    include: %w[avatar],
  }.freeze

  def serializable_hash(options = nil)
    # NOTE: doing deep_dup is necessary here to avoid changing the inner values
    # of the freezed variables (which would leak PII)!
    default_options = DEFAULT_SERIALIZE_OPTIONS.deep_dup

    include_email, exclude_deprecated = options&.values_at(:include_email, :exclude_deprecated)

    unless exclude_deprecated
      default_options[:methods].push("location", "region_id") if staff_delegate?
      default_options[:methods].push("delegate_status")
      default_options[:include].push("teams")
    end
    default_options[:methods].push("email") if include_email || staff_delegate?

    options = default_options.merge(options || {}).deep_dup

    # Preempt the values for avatar and teams, they have a special treatment.
    include_avatar = options[:include]&.delete("avatar")
    include_teams = options[:include]&.delete("teams")
    json = super

    # We override some attributes manually because it's unconvenient to
    # put them in DEFAULT_SERIALIZE_OPTIONS (eg: "teams" doesn't have a default
    # scope at the moment).
    json[:class] = self.class.to_s.downcase
    json[:teams] = deprecated_team_roles if include_teams
    json[:avatar] = self.avatar if include_avatar

    # Private attributes to include.
    private_attributes = options&.fetch(:private_attributes, []) || []
    json[:dob] = self.dob if private_attributes.include?("dob")

    json[:email] = self.email if private_attributes.include?("email")

    json
  end

  def to_wcif(competition, registration = nil, authorized: false)
    roles = registration&.roles || []
    roles << "delegate" if competition.staff_delegates.include?(self)
    roles << "trainee-delegate" if competition.trainee_delegates.include?(self)
    roles << "organizer" if competition.organizers.include?(self)
    authorized_fields = {
      "birthdate" => dob.to_fs,
      "email" => email,
    }
    {
      "name" => name,
      "wcaUserId" => id,
      "wcaId" => wca_id,
      "registrantId" => registration&.registrant_id,
      "countryIso2" => country_iso2,
      "gender" => gender,
      "registration" => registration&.to_wcif(authorized: authorized),
      "avatar" => current_avatar&.to_wcif,
      "roles" => roles,
      "assignments" => registration&.assignments&.map(&:to_wcif) || [],
      "personalBests" => person&.personal_records&.map(&:to_wcif) || [],
      "extensions" => registration&.wcif_extensions&.map(&:to_wcif) || [],
    }.merge(authorized ? authorized_fields : {})
  end

  def self.wcif_json_schema
    {
      "type" => "object",
      "properties" => {
        "registrantId" => { "type" => %w[integer null] }, # NOTE: for now registrantId may be null if the person doesn't compete.
        "name" => { "type" => "string" },
        "wcaUserId" => { "type" => "integer" },
        "wcaId" => { "type" => %w[string null] },
        "countryIso2" => { "type" => "string" },
        "gender" => { "type" => "string", "enum" => %w[m f o] },
        "birthdate" => { "type" => "string" },
        "email" => { "type" => "string" },
        "avatar" => UserAvatar.wcif_json_schema,
        "roles" => { "type" => "array", "items" => { "type" => "string" } },
        "registration" => Registration.wcif_json_schema,
        "assignments" => { "type" => "array", "items" => Assignment.wcif_json_schema },
        "personalBests" => { "type" => "array", "items" => PersonalBest.wcif_json_schema },
        "extensions" => { "type" => "array", "items" => WcifExtension.wcif_json_schema },
      },
    }
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
  def self.new_locked_account(**attributes)
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

  def special_account_competitions
    {
      organized_competitions: organized_competitions.pluck(:name),
      delegated_competitions: delegated_competitions.pluck(:name),
      announced_competitions: competitions_announced.pluck(:name),
      results_posted_competitions: competitions_results_posted.pluck(:name),
    }.reject { |_, value| value.empty? }
  end

  # Special Accounts are accounts where the WCA ID and user account should always be connected
  # These includes any teams, organizers, delegates
  # Note: Someone can Delegate a competition without ever being a Delegate.
  def special_account?
    self.roles.any? || self.special_account_competitions.present?
  end

  def accepted_registrations
    self.registrations.accepted
  end

  def accepted_competitions
    self.accepted_registrations
        .includes(competition: %i[delegates organizers events])
        .map(&:competition)
  end

  def competitions_with_active_registrations
    self.competitions_registered_for.not_over.merge(Registration.where.not(competing_status: %w[cancelled rejected]))
  end

  def delegate_in_probation?
    UserGroup.delegate_probation.flat_map(&:active_users).include?(self)
  end

  private def can_manage_delegate_probation?
    admin? || board_member? || senior_delegate? || can_access_wfc_senior_matters? || group_leader?(UserGroup.teams_committees_group_wic) || weat_team?
  end

  def senior_delegates
    delegate_roles.map { |role| role.group.senior_delegate }
  end

  def regional_delegates
    delegate_roles.map { |role| role.group.lead_user }
  end

  def can_access_senior_delegate_panel?
    admin? || board_member? || senior_delegate?
  end

  private def can_access_panel?(panel_id)
    case panel_id
    when :admin
      admin? || senior_results_team?
    when :volunteer
      staff?
    when :delegate
      any_kind_of_delegate?
    when :wfc
      can_admin_finances?
    when :wrt
      can_admin_results?
    when :wst
      software_team?
    when :board
      board_member?
    when :leader
      active_roles.any? { |role| role.lead? && (role.group.teams_committees? || role.group.councils?) }
    when :senior_delegate
      senior_delegate?
    when :wapc
      appeals_committee?
    when :wic
      wic_team?
    when :weat
      weat_team?
    else
      false
    end
  end

  def rds_credentials
    if software_team_admin? || senior_results_team?
      return [EnvConfig.DATABASE_WRT_SENIOR_USER, {
        main: EnvConfig.DATABASE_HOST,
        replica: EnvConfig.READ_REPLICA_HOST,
        dev_dump: EnvConfig.DEV_DUMP_HOST,
      }]
    end
    return unless results_team? || software_team?

    [EnvConfig.DATABASE_WRT_USER, {
      dev_dump: EnvConfig.DEV_DUMP_HOST,
    }]
  end

  def subordinate_delegates
    delegate_roles
      .filter(&:lead?)
      .flat_map { |role| role.group.active_users + role.group.active_all_child_users }
      .uniq
  end

  private def can_access_wfc_senior_matters?
    active_roles.any? { |role| role.group == UserGroup.teams_committees_group_wfc && role.metadata.at_least_senior_member? }
  end

  private def highest_delegate_role
    delegate_roles.max_by(&:status_rank)
  end

  def delegate_status
    highest_delegate_role&.metadata&.status
  end

  def region_id
    highest_delegate_role&.group_id
  end

  def location
    highest_delegate_role&.metadata&.location
  end

  def anonymization_checks_with_message_args
    upcoming_registered_competitions = competitions_with_active_registrations.pluck(:id, :name).map { |id, name| { id: id, name: name } }
    access_grants = oauth_access_grants
                    .where.not(revoked_at: nil)
                    .map do |access_grant|
                      access_grant.as_json(
                        include: {
                          application: {
                            only: %i[name redirect_uri],
                            include: {
                              owner: {
                                only: %i[name email],
                              },
                            },
                          },
                        },
                      )
                    end

    [
      {
        user_currently_banned: banned?,
        user_banned_in_past: banned_in_past?,
        user_may_have_forum_account: true,
        user_has_active_oauth_access_grants: access_grants.any?,
        user_has_upcoming_registered_competitions: upcoming_registered_competitions.any?,
      },
      {
        access_grants: access_grants,
        oauth_applications: oauth_applications,
        upcoming_registered_competitions: upcoming_registered_competitions,
      },
    ]
  end

  def anonymize(new_wca_id = nil)
    skip_reconfirmation!
    update(
      email: id.to_s + User::ANONYMOUS_ACCOUNT_EMAIL_ID_SUFFIX,
      name: User::ANONYMOUS_NAME,
      unconfirmed_wca_id: nil,
      delegate_id_to_handle_wca_id_claim: nil,
      dob: User::ANONYMOUS_DOB,
      gender: User::ANONYMOUS_GENDER,
      current_sign_in_ip: nil,
      last_sign_in_ip: nil,
      # If the account associated with the WCA ID is a special account (delegate, organizer,
      # team member) then we want to keep the link between the Person and the account.
      wca_id: special_account? ? new_wca_id : nil,
      current_avatar_id: special_account? ? nil : current_avatar_id,
      country_iso2: special_account? ? country_iso2 : nil,
    )
  end

  def transfer_data_to(new_user)
    ActiveRecord::Base.transaction do
      competition_organizers.update_all(organizer_id: new_user.id)
      competition_delegates.update_all(delegate_id: new_user.id)
      competitions_results_posted.update_all(results_posted_by: new_user.id)
      competitions_announced.update_all(announced_by: new_user.id)
      roles.update_all(user_id: new_user.id)
      registrations.update_all(user_id: new_user.id)

      return if wca_id.blank?

      wca_id_to_be_transferred = self.wca_id
      self.update!(wca_id: nil) # Must remove WCA ID before adding it as it is unique in the Users table.
      new_user.update!(wca_id: wca_id_to_be_transferred)

      # After this merge, there won't be any registrations for self as all of
      # them will be transferred to new_user. So any potential duplicates of
      # self is no longer valid. There might be some potential duplicates for
      # new_user, but they need to be refetched. But refetching here may look
      # confusing, so removing the potential duplicates of new_user as well.
      self.potential_duplicate_persons.delete_all
      new_user.potential_duplicate_persons.delete_all
    end
  end

  MY_COMPETITIONS_SERIALIZATION_HASH = {
    only: %w[id name website start_date end_date registration_open],
    methods: %w[url city country_iso2 results_posted? visible? confirmed? cancelled? report_posted? short_display_name registration_status],
    include: %w[championships],
  }.freeze

  def my_competitions
    ActiveRecord::Base.connected_to(role: :read_replica) do
      competition_ids = self.organized_competition_ids
      competition_ids.concat(self.delegated_competition_ids)

      user_registrations = self.registrations.joins(:competition).select(:competition_id, :competing_status)
      registrations = user_registrations.accepted.merge(Competition.results_posted.invert_where).to_a
      registrations.concat(user_registrations.waitlisted.merge(Competition.upcoming))
      registrations.concat(user_registrations.pending.merge(Competition.upcoming))

      registered_for_by_competition_id = registrations.uniq.to_h do |r|
        [r.competition_id, r.competing_status]
      end

      competition_ids.concat(registered_for_by_competition_id.keys)
      competition_ids.concat(self.person.competition_ids) if self.person.present?

      # An organiser might still have duties to perform for a cancelled competition until the date of the competition has passed.
      # For example, mailing all competitors about the cancellation.
      # In general ensuring ease of access until it is certain that they won't need to frequently visit the page anymore.
      competitions = Competition.not_cancelled
                                .or(Competition.not_over)
                                .includes(:delegate_report, :championships)
                                # cannot use `find` here, because `find` violently explodes when some records are not found,
                                # and in case of cancelled competitions we might have a registration but the scope above hides the competition.
                                .where(competition_id: competition_ids.uniq)
                                .sort_by { it.start_date || 20.years.from_now }
                                .reverse

      past_competitions, not_past_competitions = competitions.partition(&:probably_over?)
      bookmarked_competitions = self.competitions_bookmarked
                                    .not_over
                                    .sort_by(&:start_date)

      grouped_competitions = {
        past: past_competitions,
        future: not_past_competitions,
        bookmarked: bookmarked_competitions,
      }

      [grouped_competitions, registered_for_by_competition_id]
    end
  end
end
