class Poll_option < ActiveRecord::Base

  has_many :votes, dependent: :destroy
  has_many :users, through: :votes

  validates :description, presence: true  
end
