class PollOption < ActiveRecord::Base

  belongs_to :poll

  has_many :vote_options, dependent: :destroy
  has_many :users, through: :vote_options

  validates :description, presence: true
end
