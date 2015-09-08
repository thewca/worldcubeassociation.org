require "fileutils"

class User < ActiveRecord::Base
  has_many :delegated_competitions, through: :competition_delegates
  has_many :organized_competitions, through: :competition_organizers

  strip_attributes only: [:wca_id]

  attr_accessor :current_user

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :confirmable
  validates :name, presence: true
  validates :wca_id, format: { with: /\A(|\d{4}[A-Z]{4}\d{2})\z/ },
                     allow_nil: true
  def self.WCA_ID_MAX_LENGTH
    return 10
  end

  # Virtual attribute for authenticating by WCA id or email.
  attr_accessor :login

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
    if wca_id && !wca_id_was
      user = User.find_by_wca_id(wca_id)
      # If there is a non dummy user with this WCA id, fail validation.
      if user && !user.dummy_account?
        errors.add(:wca_id, "must be unique")
      end
    end
  end

  def dummy_account?
    wca_id.present? && encrypted_password.blank?
  end

  # To handle profile pictures that predate our user account system, we created
  # a bunch of dummy accounts (accounts with no password). When someone finally
  # claims their WCA id, we want to delete the dummy account and copy over their
  # avatar.
  before_save :remove_dummy_account_when_wca_id_assigned
  def remove_dummy_account_when_wca_id_assigned
    if wca_id && !wca_id_was
      dummy_account = User.where(wca_id: wca_id, encrypted_password: "").first
      if dummy_account
        _mounter(:avatar).uploader.override_column_value = dummy_account.read_attribute :avatar
        dummy_account.destroy!
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
    if current_user == self && admin_was && !admin? && !board_member?
      errors.add(:admin, "You cannot resign from your role as an admin! Find another admin to fire you.")
    elsif current_user == self && delegate_status_was == "board_member" && !admin? && !board_member?
      errors.add(:delegate_status, "You cannot resign from your role as a board member! Find another board member to fire you.")
    end
  end

  validate :avatar_requires_wca_id
  def avatar_requires_wca_id
    if (!avatar.blank? || !pending_avatar.blank?) && wca_id.blank?
      errors.add(:avatar, "requires a WCA id to be assigned")
    end
  end

  def can_edit_users?
    return admin? || board_member? || delegate_status != nil
  end

  def can_admin_results?
    return admin? || board_member? || results_team?
  end

  def can_manage_competition?(competition)
    return can_admin_results? || competition.organizers.include?(self) || competition.delegates.include?(self)
  end

  def editable_fields_of_user(user)
    fields = Set.new
    if user == self
      fields << :name
      fields << :current_password
      fields << :password << :password_confirmation
      fields << :email
      fields << :pending_avatar << :pending_avatar_cache << :remove_pending_avatar
      fields << :avatar_crop_x << :avatar_crop_y << :avatar_crop_w << :avatar_crop_h
      fields << :pending_avatar_crop_x << :pending_avatar_crop_y << :pending_avatar_crop_w << :pending_avatar_crop_h
      fields << :remove_avatar
    end
    if admin? || board_member?
      fields += UsersController.WCA_ROLES
      fields << :delegate_status
      fields << :senior_delegate_id
      fields << :region
    end
    if admin? || !delegate_status.blank?
      fields << :name
      fields << :wca_id
      fields << :pending_avatar << :pending_avatar_cache << :remove_pending_avatar
      fields << :avatar_crop_x << :avatar_crop_y << :avatar_crop_w << :avatar_crop_h
      fields << :pending_avatar_crop_x << :pending_avatar_crop_y << :pending_avatar_crop_w << :pending_avatar_crop_h
      fields << :avatar << :avatar_cache << :remove_avatar
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
end
