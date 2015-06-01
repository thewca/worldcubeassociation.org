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
  belongs_to :senior_delegate, -> { where(delegate_status: "senior_delegate") }, class_name: "User"
  validate :senior_delegate_must_be_senior_delegate
  validate :senior_delegate_presence

  def senior_delegate_must_be_senior_delegate
    if senior_delegate && !senior_delegate.senior_delegate?
      errors.add(:senior_delegate, "must be a senior delegate")
    end
  end

  def senior_delegate_presence
    senior_delegate_required = User.delegate_status_requires_senior_delegate(delegate_status)
    if !senior_delegate && senior_delegate_required
      errors.add(:senior_delegate, "must be present")
    end
    if senior_delegate && !senior_delegate_required
      errors.add(:senior_delegate, "must not be present")
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
end
