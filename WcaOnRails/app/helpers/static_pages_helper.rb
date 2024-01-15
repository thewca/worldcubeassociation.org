# frozen_string_literal: true

module StaticPagesHelper
  def format_team_members(team)
    team.current_members.includes(:user).order(team_leader: :desc).order("users.name asc").map do |u|
      u.user.name + (u.team_leader ? " (leader)" : "")
    end.to_sentence
  end

  def badge_for_member(tm)
    if tm.team_leader
      "team-leader-badge"
    elsif tm.team_senior_member
      "team-senior-member-badge"
    end
  end

  def subtext_for_member(tm)
    if tm.team_leader
      t("about.structure.leader")
    elsif tm.team_senior_member
      t("about.structure.senior_member")
    end
  end

  def team_member_name(name, &)
    content_tag(:div, class: "team-member-name") do
      name.html_safe + tag.br + content_tag(:span, class: "team-subtext", &)
    end
  end

  def format_team_member_content(user, &)
    name = if user.wca_id
             link_to(user.name, person_path(user.wca_id), title: t("about.structure.users.profile", user_name: user.name), data: { toggle: "tooltip", placement: "bottom" })
           else
             user.name
           end
    team_member_name(name, &)
  end

  def wca_icon
    image_tag "wca_logo.svg", class: "wca-tool-icon", data: {
      toggle: "tooltip",
      placement: "right",
      title: t("score_tools.wca_icon_text"),
    }
  end
end
