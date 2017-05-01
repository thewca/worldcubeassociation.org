# frozen_string_literal: true

module StaticPagesHelper
  def format_team_members(team)
    team.current_members.includes(:user).order(team_leader: :desc).order("users.name asc").map do |u|
      u.user.name + (u.team_leader ? " (leader)" : "")
    end.to_sentence
  end
end
