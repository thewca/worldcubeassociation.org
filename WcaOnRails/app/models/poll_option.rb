class Poll_option < ActiveRecord::Base

  belongs_to :poll

  has_many :votes, dependent: :destroy
  has_many :users, through: :votes

  validates :description, presence: true  
end
