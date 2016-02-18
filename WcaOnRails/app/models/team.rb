class Team < ActiveRecord::Base
  has_many :users, through: :team_member
  belongs_to :leader, class_name: "User", foreign_key: "leader_id"
end
