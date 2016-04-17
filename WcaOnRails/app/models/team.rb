class Team < ActiveRecord::Base
  has_many :team_members, dependent: :destroy

  accepts_nested_attributes_for :team_members, reject_if: :all_blank, allow_destroy: true

  validate :membership_periods_cannot_overlap_for_single_user
  def membership_periods_cannot_overlap_for_single_user
    team_members.group_by(&:user).each do |user, memberships|
      memberships.combination(2).to_h.each do |first, second|
        first_period = first.start_date..(first.end_date || Date::Infinity.new)
        second_period = second.start_date..(second.end_date || Date::Infinity.new)
        if first_period.overlaps? second_period
          message = "Membership periods overlap for user #{user.name}"
          errors[:base] << message unless errors[:base].include?(message)
        end
      end
    end
  end
end
