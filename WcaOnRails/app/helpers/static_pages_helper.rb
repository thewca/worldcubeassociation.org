# frozen_string_literal: true

module StaticPagesHelper
  def format_team_members(team)
    team.current_members.includes(:user).order(team_leader: :desc).order("users.name asc").map do |u|
      u.user.name + (u.team_leader ? " (leader)" : "")
    end.to_sentence
  end

  def documents_list(directory)
    safe_join Dir.glob("#{Rails.root}/public/documents/#{directory}/*.pdf")
                 .sort
                 .map { |doc| File.basename(doc, ".pdf") }
                 .map { |name| content_tag(:li, link_to(name, "/documents/#{directory}/#{name}.pdf")) }
  end
end
