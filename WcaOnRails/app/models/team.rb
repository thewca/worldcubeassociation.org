class Team < ActiveRecord::Base
  has_many :team_members, dependent: :destroy
  belongs_to :leader, class_name: "User", foreign_key: "leader_id"

  accepts_nested_attributes_for :team_members, reject_if: :all_blank, allow_destroy: true
end
