# frozen_string_literal: true

class PollOption < ApplicationRecord
  belongs_to :poll

  has_many :vote_options, dependent: :destroy
  has_many :users, through: :vote_options

  validates :description, presence: true

  def percentage
    if self.poll.votes.count > 0
      (self.vote_options.count.to_f / self.poll.votes.count * 100).round(2)
    else
      0
    end
  end
end
