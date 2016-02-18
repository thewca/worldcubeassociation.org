class Team < ActiveRecord::Base
  has_many :users, through: :team_member
end
