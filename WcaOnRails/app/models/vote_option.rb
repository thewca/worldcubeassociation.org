class VoteOption < ActiveRecord::Base

  belongs_to :vote

  has_many :poll_options
end
