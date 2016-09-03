# frozen_string_literal: true
module StaticPagesHelper
  def format_team_members(slug)
    Team.find_by_slug!(slug).current_members.includes(:user, :committee_position).order("committee_positions.team_leader desc").order("users.name asc").map do |u|
      u.user.name + (u.committee_position.team_leader ? " (leader)" : "")
    end.to_sentence
  end
end
