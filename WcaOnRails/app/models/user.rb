class User < ActiveRecord::Base
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :confirmable
  validates :name, presence: true
  enum delegate_status: {
    candidate_delegate: "candidate_delegate",
    delegate: "delegate",
    senior_delegate: "senior_delegate",
    board_member: "board_member",
  }
  has_many :subordinate_delegates, class_name: "User", foreign_key: "senior_delegate_id"
  belongs_to :senior_delegate, -> { where(delegate_status: "senior_delegate").order(:name) }, class_name: "User"
  validate :senior_delegate_must_be_senior_delegate

  def senior_delegate_must_be_senior_delegate
    if senior_delegate && !senior_delegate.senior_delegate?
      errors.add(:senior_delegate, "must be a senior delegate")
    end
  end

  def self.delegate_status_requires_senior_delegate(delegate_status)
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
    if admin? || board_member?
      return Set.new(UsersController.WCA_ROLES + [
        :name, :delegate_status, :senior_delegate_id, :region ])
    elsif senior_delegate? || delegate? || candidate_delegate?
      return Set.new([ :name ])
    end
  end
end
