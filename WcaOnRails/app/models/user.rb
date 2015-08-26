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
                     uniqueness: true, allow_nil: true
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

  mount_uploader :avatar, AvatarUploader
  skip_callback :save, :after, :remove_previously_stored_avatar
  validates :avatar,
    file_size: {
      maximum: 2.megabytes.to_i
    }

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
    if !avatar.blank? && wca_id.blank?
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
      fields << :avatar << :avatar_cache << :remove_avatar
      fields << :current_password
      fields << :password << :password_confirmation
      fields << :email
    end
    if admin? || board_member?
      fields += UsersController.WCA_ROLES
      fields << :delegate_status
      fields << :senior_delegate_id
      fields << :region
      fields << :avatar << :avatar_cache << :remove_avatar
    end
    if admin? || !delegate_status.blank?
      fields << :name
      fields << :wca_id
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
end
