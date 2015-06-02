class User < ActiveRecord::Base
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :confirmable
  validates :name, presence: true
  validates :wca_id, format: { with: /\A(|\d{4}[A-Z]{4}\d{2})\z/ }
  def self.WCA_ID_MAX_LENGTH
    return 10
  end

  enum delegate_status: {
    candidate_delegate: "candidate_delegate",
    delegate: "delegate",
    senior_delegate: "senior_delegate",
    board_member: "board_member",
  }
  has_many :subordinate_delegates, class_name: "User", foreign_key: "senior_delegate_id"
  belongs_to :senior_delegate, -> { where(delegate_status: "senior_delegate").order(:name) }, class_name: "User"
  validate :senior_delegate_must_be_senior_delegate
  validate :senior_delegate_presence

  def senior_delegate_must_be_senior_delegate
    if senior_delegate && !senior_delegate.senior_delegate?
      errors.add(:senior_delegate, "must be a senior delegate")
    end
  end

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

  def can_edit_users?
    return admin? || board_member? || delegate_status != nil
  end

  def editable_other_user_fields
    fields = Set.new
    if admin? || board_member?
      fields += UsersController.WCA_ROLES
      fields << :delegate_status
      fields << :senior_delegate_id
      fields << :region
    end
    if admin? || !delegate_status.blank?
      fields << :name
      fields << :wca_id
    end
    fields
  end
end
