class Team < ActiveRecord::Base
  has_many :team_members, dependent: :destroy

  accepts_nested_attributes_for :team_members, reject_if: :all_blank, allow_destroy: true
end
