# frozen_string_literal: true

module PersonsHelper
  def rank_td(rank_object, type, wca_id, region_id = nil)
    region_type = "world"
    if region_id&.starts_with?("_")
      region_type = "continent"
    elsif region_id
      region_type = "country"
    end
    rank = rank_object&.public_send("#{region_type}_rank")
    rank = "-" if rank == 0
    content_tag(:td, class: "#{region_type}-rank #{'record' if rank == 1}") do
      rank ? link_to(rank, rankings_path(rank_object.event_id, type, region: region_id, focus: wca_id), class: :plain) : nil
    end
  end

  def odd_rank_reason
    ui_icon("question circle", title: t("persons.show.odd_rank_reason"), data: { toggle: "tooltip" })
  end

  def odd_rank_reason_needed?(rank_single, rank_average)
    odd_rank?(rank_single) || (rank_average && odd_rank?(rank_average))
  end

  def odd_rank?(rank)
    any_missing = rank.continent_rank == 0 || rank.country_rank == 0 # NOTE: world rank is always present.
    any_missing || rank.continent_rank < rank.country_rank
  end

  def return_podium_class(result)
    if (result.roundTypeId == 'f' || result.roundTypeId == 'c') && !result.best_solve.dnf?
      case result.pos
      when 1
        "gold-place"
      when 2
        "silver-place"
      when 3
        "bronze-place"
      end
    end
  end

  def delegate_badge(kind)
    title = t("enums.user.delegate_status." + kind)
    content_tag(:span, class: "badge delegate-badge", data: { toggle: "tooltip", placement: "bottom" }, title: title) do
      kind == "trainee_delegate" ? title : link_to(title, "/delegates")
    end
  end

  def officer_badge(team)
    content_tag(:span, class: "badge officer-badge") do
      link_to(team, "/teams-committees#officers", title: t('about.structure.officers.name'), data: { toggle: "tooltip", placement: "bottom" })
    end
  end

  def team_badge(team, kind, extra)
    content_tag(:span, class: "badge team-" + kind + "-badge") do
      link_to(team.acronym + extra, "/teams-committees#" + team.acronym, title: team.name, data: { toggle: "tooltip", placement: "bottom" })
    end
  end

  def all_user_badges(user)
    # Checks if person is any kind of Delegate, officer, Board member, any Team leader, any team sennior member,
    # any team member and display all the badges in that order
    badges = []
    if user.any_kind_of_delegate? # Delegates
      if user.senior_delegate?
        badges.push(delegate_badge("senior_delegate"))
      elsif user.full_delegate?
        badges.push(delegate_badge("delegate"))
      elsif user.candidate_delegate?
        badges.push(delegate_badge("candidate_delegate"))
      else
        badges.push(delegate_badge("trainee_delegate"))
      end
    end

    user.current_teams.select { |team| Team.all_officers.include? team }.map(&:name).each do |team| # Officers
      badges.push(officer_badge(team))
    end
    if Team.wfc.current_members.select(&:team_leader).map(&:user).include?(user)
      badges.push(officer_badge(t('about.structure.treasurer.name')))
    end

    if user.board_member? # Board
      badges.push(team_badge(Team.board, "member", ""))
    end

    # Team Leaders and Senior Members
    badges.push(user.teams_where_is_leader.map { |team| team_badge(team, "leader", " " + t('about.structure.leader')) })
    badges.push(user.teams_where_is_senior_member.map { |team| team_badge(team, "senior-member", " " + t('about.structure.senior_member')) })
    badges.push(user.current_teams.select { |t| Team.all_official_and_councils.include?(t) } # Team members
                                          .reject { |t| user.team_leader?(t) || user.team_senior_member?(t) }
                                          .map { |team| team_badge(team, "member", "") })

    badges.join.html_safe
  end
end
