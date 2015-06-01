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
  validate :delegate_must_have_senior_delegate
  validate :board_and_senior_delegates_must_not_have_senior_delegate

  def senior_delegate_must_be_senior_delegate
    if senior_delegate && !senior_delegate.senior_delegate?
      errors.add(:senior_delegate, "must be a senior delegate")
    end
  end

  def delegate_must_have_senior_delegate
    if !senior_delegate
      if delegate?
        errors.add(:senior_delegate, "must be present for a WCA delegate")
      elsif candidate_delegate?
        errors.add(:senior_delegate, "must be present for a WCA candidate delegate")
      end
    end
  end

  def board_and_senior_delegates_must_not_have_senior_delegate
    if senior_delegate
      if !delegate_status
        errors.add(:senior_delegate, "must not be present for a non delegate")
      elsif board_member?
        errors.add(:senior_delegate, "must not be present for a board member")
      elsif senior_delegate?
        errors.add(:senior_delegate, "must not be present for a senior delegate")
      end
    end
  end
end
