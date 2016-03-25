module StaticPagesHelper
  def format_team_members(team_friendly_id)
    TeamMember.where(team_id: Team.find_by_friendly_id!(team_friendly_id).id).includes(:user).order(team_leader: :desc).order("users.name asc").map do |u|
      s = u.user.name
      if u.team_leader
        s += " (leader)"
      end
      s
    end.join(", ")
  end
end
