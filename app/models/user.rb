# frozen_string_literal: true

require "uri"
require "fileutils"

class User < ApplicationRecord
  include MicroserviceRegistrationHolder

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
  belongs_to :person, -> { where(subId: 1) }, primary_key: "wca_id", foreign_key: "wca_id", optional: true
  belongs_to :unconfirmed_person, -> { where(subId: 1) }, primary_key: "wca_id", foreign_key: "unconfirmed_wca_id", class_name: "Person", optional: true
  belongs_to :delegate_to_handle_wca_id_claim, foreign_key: "delegate_id_to_handle_wca_id_claim", class_name: "User", optional: true
  belongs_to :region, class_name: "UserGroup", optional: true
  has_many :roles, class_name: "UserRole"
  has_many :active_roles, -> { active }, class_name: "UserRole"
  has_many :delegate_role_metadata, through: :active_roles, source: :metadata, source_type: "RolesMetadataDelegateRegions"
  has_many :delegate_roles, through: :delegate_role_metadata, source: :user_role, class_name: "UserRole"
  has_many :team_members, dependent: :destroy
  has_many :teams, -> { distinct }, through: :team_members
  has_many :current_team_members, -> { current }, class_name: "TeamMember"
  has_many :current_teams, -> { distinct }, through: :current_team_members, source: :team
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
  has_many :ranksSingle, through: :person
  has_many :ranksAverage, through: :person
  has_one :wfc_dues_redirect, as: :redirect_source

  scope :confirmed_email, -> { where.not(confirmed_at: nil) }

  scope :in_region, lambda { |region_id|
    unless region_id.blank? || region_id == 'all'
      where(country_iso2: (Continent.country_iso2s(region_id) || Country.c_find(region_id)&.iso2))
    end
  }

  scope :with_delegate_data, -> { includes(:actually_delegated_competitions, :region) }

  def self.eligible_voters
    [
      UserGroup.delegate_regions,
      UserGroup.teams_committees,
      UserGroup.board,
      UserGroup.officers,
    ].flatten.flat_map(&:active_roles)
      .select { |role| role.is_eligible_voter? }
      .map { |role| role.user }
      .uniq
  end

  def self.leader_senior_voters
    team_leaders = RolesMetadataTeamsCommittees.leader.includes(:user, :user_role).select { |role_metadata| role_metadata.user_role.is_active? }.map(&:user)
    senior_delegates = RolesMetadataDelegateRegions.senior_delegate.includes(:user, :user_role).select { |role_metadata| role_metadata.user_role.is_active? }.map(&:user)
    (team_leaders + senior_delegates).uniq.compact
  end

  def self.all_discourse_groups
    UserGroup.teams_committees.map(&:metadata).map(&:friendly_id) + UserGroup.councils.map(&:metadata).map(&:friendly_id) + RolesMetadataDelegateRegions.statuses.values + [UserGroup.group_types[:board]]
  end

  accepts_nested_attributes_for :user_preferred_events, allow_destroy: true

  strip_attributes only: [:wca_id, :country_iso2]

  attr_accessor :current_user

  devise :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :confirmable
  devise :two_factor_authenticatable,
         otp_secret_encryption_key: AppSecrets.OTP_ENCRYPTION_KEY
  BACKUP_CODES_LENGTH = 8
  NUMBER_OF_BACKUP_CODES = 10
  devise :two_factor_backupable,
         otp_backup_code_length: BACKUP_CODES_LENGTH,
         otp_number_of_backup_codes: NUMBER_OF_BACKUP_CODES
  devise :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  def jwt_payload
    { 'user_id' => id }
  end

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

  ALLOWABLE_GENDERS = [:m, :f, :o].freeze
  enum gender: (ALLOWABLE_GENDERS.to_h { |g| [g, g.to_s] })
  GENDER_LABEL_METHOD = lambda do |g|
    {
      m: I18n.t('enums.user.gender.m'),
      f: I18n.t('enums.user.gender.f'),
      o: I18n.t('enums.user.gender.o'),
    }[g]
  end

  validate :wca_id_is_unique_or_for_dummy_account
  def wca_id_is_unique_or_for_dummy_account
    if wca_id_change && wca_id
      user = User.find_by_wca_id(wca_id)
      # If there is a non dummy user with this WCA ID, fail validation.
      if user && !user.dummy_account?
        errors.add(
          :wca_id,
          I18n.t('users.errors.unique_html',
                 used_name: user.name,
                 used_email: user.email,
                 used_edit_path: Rails.application.routes.url_helpers.edit_user_path(user)).html_safe,
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
  def claim_wca_id_validations # rubocop:disable Metrics/CyclomaticComplexity,Metrics/PerceivedComplexity
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
        wrt_contact_path = Rails.application.routes.url_helpers.contact_path(contactRecipient: 'wrt')
        remaining_wca_id_claims = [0, MAX_INCORRECT_WCA_ID_CLAIM_COUNT - unconfirmed_person.incorrect_wca_id_claim_count].max
        if remaining_wca_id_claims == 0 || !unconfirmed_person.dob
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
      if claiming_wca_id && person
        errors.add(:unconfirmed_wca_id, I18n.t('users.errors.already_have_id', wca_id: wca_id))
      end

      if delegate_id_to_handle_wca_id_claim.present? && !delegate_to_handle_wca_id_claim&.any_kind_of_delegate?
        errors.add(:delegate_id_to_handle_wca_id_claim, I18n.t('users.errors.not_found'))
      end
    end
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
    if p
      self.name = p.name
      self.dob = p.dob
      self.gender = p.gender
      self.country_iso2 = p.country_iso2
    end
  end

  validate :must_look_like_the_corresponding_person
  private def must_look_like_the_corresponding_person
    if person
      if self.name != person.name
        errors.add(:name, I18n.t("users.errors.must_match_person"))
      end
      if self.country_iso2 != person.country_iso2
        errors.add(:country_iso2, I18n.t("users.errors.must_match_person"))
      end
      if self.gender != person.gender
        errors.add(:gender, I18n.t("users.errors.must_match_person"))
      end
      if self.dob != person.dob
        errors.add(:dob, I18n.t("users.errors.must_match_person"))
      end
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
        _mounter(:avatar).uploaders.each do |uploader|
          uploader.override_column_value = dummy_user.read_attribute :avatar
        end
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

  def old_avatar_files
    # CarrierWave doesn't have a general "list uploaded files" feature
    # so we have to hijack the class-private storage engine to make direct S3 API calls
    avatar_storage = avatar.send(:storage)
    s3_client = avatar_storage.connection

    # query underlying AWS S3 API directly
    s3_bucket = s3_client.bucket(avatar.aws_bucket)

    files = s3_bucket.objects({ prefix: avatar.store_dir })
                     .select { |obj| !obj.key.include?('thumb') } # filter out thumbnails
                     .map { |obj| obj.key.rpartition('/').last } # only take the filename itself, not the folder path
                     .map { |key| avatar_storage.retrieve!(key) } # read the filename through CarrierWave for convenience

    files.select do |f|
      (!pending_avatar.url || pending_avatar.url != f.url) && (!avatar.url || avatar.url != f.url)
    end
  end

  before_save :stash_rejected_avatar
  def stash_rejected_avatar
    if ActiveRecord::Type::Boolean.new.cast(remove_pending_avatar) && pending_avatar_was
      # hijacking internal S3 storage engine, see method `old_avatar_files` above
      avatar_storage = avatar.send(:storage)

      file = avatar_storage.retrieve!(pending_avatar_was)
      rejected_filename = "#{avatar.store_dir}/rejected/#{pending_avatar_was}"

      file.move_to rejected_filename
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

  validate :avatar_requires_wca_id
  def avatar_requires_wca_id
    if (!avatar.blank? || !pending_avatar.blank?) && wca_id.blank?
      errors.add(:avatar, I18n.t('users.errors.avatar_requires_wca_id'))
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

  private def group_member?(group)
    active_roles.any? { |role| role.group == group }
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

  def wdc_team?
    group_member?(UserGroup.teams_committees_group_wdc)
  end

  def ethics_committee?
    group_member?(UserGroup.teams_committees_group_wec)
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

  private def software_team?
    group_member?(UserGroup.teams_committees_group_wst)
  end

  private def software_team_admin?
    active_roles.any? { |role| role.group == UserGroup.teams_committees_group_wst_admin }
  end

  def staff?
    active_roles.any? { |role| role.is_staff? }
  end

  def admin?
    Rails.env.production? && EnvConfig.WCA_LIVE_SITE? ? software_team_admin? : software_team?
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

  def staff_or_any_delegate?
    staff? || any_kind_of_delegate?
  end

  def is_senior_delegate_for?(user)
    user.senior_delegates.include?(self)
  end

  def banned?
    current_teams.include?(Team.banned)
  end

  def current_ban
    current_team_members.where(team: Team.banned).first
  end

  def ban_end
    current_ban&.end_date
  end

  def banned_at_date?(date)
    if banned?
      !ban_end.present? || date < ban_end
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

  private def groups_with_edit_access
    return "*" if can_edit_any_groups?
    groups = []

    active_roles.select do |role|
      group = role.group
      group_type = role.group_type
      if [UserGroup.group_types[:councils], UserGroup.group_types[:teams_committees]].include?(group_type)
        if role.is_lead?
          groups << group.id
        end
      elsif group_type == UserGroup.group_types[:delegate_regions]
        if role.is_lead? && role.metadata.status == RolesMetadataDelegateRegions.statuses[:senior_delegate]
          groups += [group.id, group.all_child_groups.map(&:id)].flatten.uniq
        end
      end
    end

    if can_manage_delegate_probation?
      groups += UserGroup.delegate_probation.ids
    end

    if software_team?
      groups << UserGroup.translators.ids
    end

    groups
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
        scope: can_admin_competitions? ? "*" : (delegated_competitions + organized_competitions).pluck(:id),
      },
      can_view_delegate_admin_page: {
        scope: can_view_delegate_matters? ? "*" : [],
      },
      can_create_groups: {
        scope: groups_with_create_access,
      },
      can_edit_groups: {
        scope: groups_with_edit_access,
      },
      can_access_wfc_senior_matters: {
        scope: can_access_wfc_senior_matters? ? "*" : [],
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
    admin? || board_member? || results_team? || communication_team? || wdc_team? || any_kind_of_delegate? || weat_team?
  end

  def can_edit_user?(user)
    self == user || can_view_all_users? || organizer_for?(user)
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

  def can_admin_finances?
    admin? || financial_committee?
  end

  def can_view_banned_competitors?
    admin? || staff?
  end

  def can_edit_banned_competitors?
    can_edit_any_groups? || group_leader?(UserGroup.teams_committees_group_wdc)
  end

  def can_manage_regional_organizations?
    admin? || board_member?
  end

  def can_create_competitions?
    can_admin_results? || any_kind_of_delegate?
  end

  def can_create_posts?
    wdc_team? || wrc_team? || communication_team? || can_announce_competitions?
  end

  def can_upload_images?
    (
      can_create_posts? ||
      any_kind_of_delegate? || # Delegates are allowed to upload photos when writing a delegate report.
      can_manage_any_not_over_competitions? # Competition managers may want to upload photos to their competition tabs.
    )
  end

  def can_admin_competitions?
    can_admin_results? || competition_announcement_team?
  end

  alias_method :can_announce_competitions?, :can_admin_competitions?

  def can_manage_competition?(competition)
    (
      can_admin_competitions? ||
      competition.organizers.include?(self) ||
      competition.delegates.include?(self) ||
      wrc_team? ||
      competition.delegates.flat_map(&:senior_delegates).compact.include?(self) ||
      ethics_committee?
    )
  end

  def can_manage_any_not_over_competitions?
    delegated_competitions.not_over.present? || organized_competitions.not_over.present?
  end

  def can_view_hidden_competitions?
    can_admin_competitions? || any_kind_of_delegate?
  end

  def can_edit_registration?(registration)
    # A registration can be edited by a user if it hasn't been accepted yet, and if edits are allowed.
    editable_by_user = (!registration.accepted? || registration.competition.registration_edits_allowed?)
    can_manage_competition?(registration.competition) || (registration.user_id == self.id && editable_by_user)
  end

  def can_delete_registration?(registration)
    # A registration can only be deleted by a user after it has been accepted if the organizers allow
    can_delete_by_user = (!registration.accepted? || registration.competition.registration_delete_after_acceptance_allowed?)
    can_manage_competition?(registration.competition) || (registration.user_id == self.id && can_delete_by_user)
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
    can_submit_competition_results?(competition, upload_only: true)
  end

  def can_submit_competition_results?(competition, upload_only: false)
    allowed_delegate = if upload_only
                         competition.delegates.include?(self)
                       else
                         competition.staff_delegates.include?(self)
                       end
    appropriate_role = can_admin_results? || allowed_delegate
    appropriate_time = competition.in_progress? || competition.is_probably_over?
    competition.announced? && appropriate_role && appropriate_time && !competition.results_posted?
  end

  def can_create_poll?
    admin? || board_member? || wrc_team? || wdc_team? || quality_assurance_committee?
  end

  def can_vote_in_poll?
    staff?
  end

  def can_view_poll?
    can_create_poll? || can_vote_in_poll?
  end

  def can_view_delegate_matters?
    any_kind_of_delegate? || can_admin_results? || wrc_team? || wdc_team? || quality_assurance_committee? || competition_announcement_team? || weat_team? || communication_team? || ethics_committee? || financial_committee?
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
      can_edit_delegate_report?(delegate_report) || ethics_committee?
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
    can_admin_competitions? || senior_delegate? || quality_assurance_committee? || weat_team?
  end

  def can_issue_refunds?(competition)
    competition.managers.include?(self) || admin?
  end

  def can_approve_media?
    admin? || communication_team? || board_member?
  end

  def can_see_eligible_voters?
    can_admin_results? || group_leader?(UserGroup.teams_committees_group_wec)
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
    # Don't allow editing data if they have a WCA ID assigned, or if they
    # have already registered for a competition. We do allow admins and delegates
    # who have registered for a competition to edit their own data.
    cannot_edit_reason = if user_to_edit.wca_id_was && user_to_edit.wca_id
                           # Not using _html suffix as automatic html_safe is available only from
                           # the view helper
                           I18n.t('users.edit.cannot_edit.reason.assigned')
                         elsif user_to_edit == self && !(admin? || any_kind_of_delegate?) && user_to_edit.registrations.accepted.count > 0
                           I18n.t('users.edit.cannot_edit.reason.registered')
                         end
    if cannot_edit_reason
      I18n.t('users.edit.cannot_edit.msg',
             reason: cannot_edit_reason,
             wrt_contact_path: Rails.application.routes.url_helpers.contact_path(contactRecipient: 'wrt'),
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
    fields += editable_personal_preference_fields(user)
    fields += editable_competitor_info_fields(user)
    fields += editable_avatar_fields(user)
    fields
  end

  private def editable_personal_preference_fields(user)
    fields = Set.new
    if user == self
      fields += %i(
        password password_confirmation
        email preferred_events results_notifications_enabled
        registration_notifications_enabled
      )
      fields << { user_preferred_events_attributes: [:id, :event_id, :_destroy] }
      if user.staff_or_any_delegate?
        fields += %i(receive_delegate_reports)
      end
    end
    fields
  end

  private def editable_competitor_info_fields(user)
    fields = Set.new
    if user == self || admin? || any_kind_of_delegate? || results_team? || communication_team?
      unless cannot_edit_data_reason_html(user)
        fields += %i(name dob gender country_iso2)
      end
      fields += CLAIM_WCA_ID_PARAMS
    end
    if user.wca_id.blank? && organizer_for?(user)
      fields << :name
    end
    if admin? || any_kind_of_delegate? || results_team? || communication_team?
      fields += %i(
        unconfirmed_wca_id
      )
      unless user.is_special_account?
        fields += %i(wca_id)
      end
    end
    fields
  end

  private def editable_avatar_fields(user)
    fields = Set.new
    if admin? || results_team?
      fields += %i(avatar avatar_cache)
    end
    if user == self || admin? || results_team? || is_senior_delegate_for?(user)
      fields += %i(
        pending_avatar pending_avatar_cache remove_pending_avatar
        avatar_crop_x avatar_crop_y avatar_crop_w avatar_crop_h
        pending_avatar_crop_x pending_avatar_crop_y pending_avatar_crop_w pending_avatar_crop_h
        remove_avatar
      )
    end
    fields
  end

  def self.clear_receive_delegate_reports_if_not_eligible
    User.where(receive_delegate_reports: true).reject(&:staff_or_any_delegate?).map { |u| u.update(receive_delegate_reports: false) }
  end

  # This method is only called in sync_mailing_lists_job.rb, right after clear_receive_delegate_reports_if_not_eligible.
  # If used without calling clear_receive_delegate_reports_if_not_eligible it might return non-current eligible members.
  # The reason why clear_receive_delegate_reports_if_not_eligible is needed is because there's no automatic code that
  # runs once a user is no longer a team member, we just schedule their end date.
  def self.delegate_reports_receivers_emails
    delegate_groups = UserGroup.delegate_regions
    roles = delegate_groups.flat_map(&:active_roles).select do |role|
      ["trainee_delegate", "junior_delegate"].include?(role.metadata.status)
    end
    eligible_delegate_users = roles.map { |role| role.user }
    other_staff = User.where(receive_delegate_reports: true)
    (%w(
      seniors@worldcubeassociation.org
      quality@worldcubeassociation.org
      regulations@worldcubeassociation.org
    ) + eligible_delegate_users.map(&:email) + other_staff.map(&:email)).uniq
  end

  def notify_of_results_posted(competition)
    if results_notifications_enabled?
      CompetitionsMailer.notify_users_of_results_presence(self, competition).deliver_later
    end
  end

  def maybe_assign_wca_id_by_results(competition, notify: true)
    if !wca_id && !unconfirmed_wca_id
      matches = []
      unless country.nil? || dob.nil?
        matches = competition.competitors.where(name: name, dob: dob, gender: gender, countryId: country.id).to_a
      end
      if matches.size == 1 && matches.first.user.nil?
        update(wca_id: matches.first.wca_id)
      elsif notify
        notify_of_id_claim_possibility(competition)
      end
    end
  end

  def notify_of_id_claim_possibility(competition)
    if !wca_id && !unconfirmed_wca_id
      CompetitionsMailer.notify_users_of_id_claim_possibility(self, competition).deliver_later
    end
  end

  def is_bookmarked?(competition)
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

  def self.staff_delegate_ids
    UserGroup
      .delegate_regions
      .flat_map(&:active_roles)
      .select { |role| role.is_staff? }
      .map { |role| role.user_id }
  end

  def self.trainee_delegate_ids
    UserGroup
      .delegate_regions
      .flat_map(&:active_roles)
      .select { |role| role.metadata.status == RolesMetadataDelegateRegions.statuses[:trainee_delegate] }
      .map { |role| role.user_id }
  end

  def self.search(query, params: {})
    users = Person.includes(:user).current
    # We can't search by email on the 'Person' table
    search_by_email = false
    unless ActiveRecord::Type::Boolean.new.cast(params[:persons_table])
      users = User.confirmed_email.not_dummy_account
      search_by_email = ActiveRecord::Type::Boolean.new.cast(params[:email])

      if ActiveRecord::Type::Boolean.new.cast(params[:only_staff_delegates])
        users = users.where(id: self.staff_delegate_ids)
      end

      if ActiveRecord::Type::Boolean.new.cast(params[:only_trainee_delegates])
        users = users.where(id: self.trainee_delegate_ids)
      end

      if ActiveRecord::Type::Boolean.new.cast(params[:only_with_wca_ids])
        users = users.where.not(wca_id: nil)
      end
    end

    query.split.each do |part|
      users = users.where("name LIKE :part OR wca_id LIKE :part #{"OR email LIKE :part" if search_by_email}", part: "%#{part}%")
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
      .select { |role|
        [
          UserGroup.group_types[:teams_committees],
          UserGroup.group_types[:councils],
          UserGroup.group_types[:board],
        ].include?(role.group_type)
      }
      .reject { |role| role.group.is_hidden }
      .map { |role| role.deprecated_team_role }
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: ["id", "wca_id", "name", "gender",
           "country_iso2", "created_at", "updated_at"],
    methods: ["url", "country", "delegate_status"],
    include: ["avatar", "teams"],
  }.freeze

  def serializable_hash(options = nil)
    # NOTE: doing deep_dup is necessary here to avoid changing the inner values
    # of the freezed variables (which would leak PII)!
    default_options = DEFAULT_SERIALIZE_OPTIONS.deep_dup
    # Delegates's emails and regions are public information.
    if staff_delegate?
      default_options[:methods].push("email", "location", "region_id")
    end

    options = default_options.merge(options || {})
    # Preempt the values for avatar and teams, they have a special treatment.
    include_avatar = options[:include]&.delete("avatar")
    include_teams = options[:include]&.delete("teams")
    json = super(options)

    # We override some attributes manually because it's unconvenient to
    # put them in DEFAULT_SERIALIZE_OPTIONS (eg: "teams" doesn't have a default
    # scope at the moment).
    json[:class] = self.class.to_s.downcase
    if include_teams
      json[:teams] = deprecated_team_roles
    end
    if include_avatar
      json[:avatar] = {
        url: self.avatar.url,
        pending_url: self.pending_avatar.url,
        thumb_url: self.avatar.url(:thumb),
        is_default: !self.avatar?,
      }
    end

    # Private attributes to include.
    private_attributes = options&.fetch(:private_attributes, []) || []
    if private_attributes.include?("dob")
      json[:dob] = self.dob
    end

    if private_attributes.include?("email")
      json[:email] = self.email
    end

    json
  end

  def to_wcif(competition, registration = nil, registrant_id = nil, authorized: false)
    person_pb = [person&.ranksAverage, person&.ranksSingle].compact.flatten
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
      "registrantId" => registrant_id,
      "countryIso2" => country_iso2,
      "gender" => gender,
      "registration" => registration&.to_wcif(authorized: authorized),
      "avatar" => {
        "url" => avatar.url,
        "thumbUrl" => avatar.url(:thumb),
      },
      "roles" => roles,
      "assignments" => registration&.assignments&.map(&:to_wcif) || [],
      "personalBests" => person_pb.map(&:to_wcif),
      "extensions" => registration&.wcif_extensions&.map(&:to_wcif) || [],
    }.merge(authorized ? authorized_fields : {})
  end

  def self.wcif_json_schema
    {
      "type" => "object",
      "properties" => {
        "registrantId" => { "type" => ["integer", "null"] }, # NOTE: for now registrantId may be null if the person doesn't compete.
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

  # Special Accounts are accounts where the WCA ID and user account should always be connected
  # These includes any teams, organizers, delegates
  # Note: Someone can Delegate a competition without ever being a Delegate.
  def is_special_account?
    self.teams.any? ||
      self.roles.any? ||
      !self.organized_competitions.empty? ||
      !delegated_competitions.empty? ||
      !competitions_announced.empty? ||
      !competitions_results_posted.empty?
  end

  def accepted_registrations
    self.registrations.accepted
  end

  def accepted_competitions
    self.accepted_registrations
        .includes(competition: [:delegates, :organizers, :events])
        .map(&:competition)
  end

  def is_delegate_in_probation
    UserGroup.delegate_probation.flat_map(&:active_users).include?(self)
  end

  private def can_manage_delegate_probation?
    admin? || board_member? || senior_delegate? || can_access_wfc_senior_matters?
  end

  def senior_delegates
    delegate_roles.map { |role| role.group.senior_delegate }
  end

  def regional_delegates
    delegate_roles.map { |role| role.group.lead_user }
  end

  def can_access_wfc_panel?
    can_admin_finances?
  end

  def can_access_wrt_panel?
    can_admin_results?
  end

  def can_access_wst_panel?
    software_team?
  end

  def can_access_board_panel?
    admin? || board_member?
  end

  def can_access_leader_panel?
    admin? || active_roles.any? { |role| role.is_lead? && (role.group.teams_committees? || role.group.councils?) }
  end

  def can_access_senior_delegate_panel?
    admin? || board_member? || senior_delegate?
  end

  def can_access_delegate_panel?
    admin? || any_kind_of_delegate?
  end

  def can_access_staff_panel?
    admin? || staff?
  end

  def can_access_panel?
    (
      can_access_wfc_panel? ||
      can_access_wrt_panel? ||
      can_access_wst_panel? ||
      can_access_board_panel? ||
      can_access_leader_panel? ||
      can_access_senior_delegate_panel? ||
      can_access_delegate_panel? ||
      can_access_staff_panel?
    )
  end

  def subordinate_delegates
    delegate_roles
      .filter { |role| role.is_lead? }
      .flat_map { |role| role.group.active_users + role.group.active_users_of_all_child_groups }
      .uniq
  end

  private def can_access_wfc_senior_matters?
    active_roles.any? { |role| role.group == UserGroup.teams_committees_group_wfc && role.metadata.at_least_senior_member? }
  end

  private def highest_delegate_role
    delegate_roles.max_by { |role| role.status_sort_rank }
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
end
