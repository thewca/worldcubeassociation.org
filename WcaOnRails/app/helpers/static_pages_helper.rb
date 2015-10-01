module StaticPagesHelper
  def format_team_members(team)
    leader_team = :"#{team}_leader"
    User.where(team => true).order(leader_team => :desc, name: :asc).map do |u|
      s = u.name
      if u.send(leader_team)
        s += " (leader)"
      end
      s
    end.join(", ")
  end
end
