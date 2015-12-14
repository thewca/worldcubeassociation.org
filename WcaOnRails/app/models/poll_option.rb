class PollOption < ActiveRecord::Base

  belongs_to :poll

  has_many :vote_options, dependent: :destroy
  has_many :users, through: :vote_options

  has_and_belongs_to_many :votes, through: :vote_options

  validates :description, presence: true
end
