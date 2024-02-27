# frozen_string_literal: true

class IncidentCompetitionIdInput < CompetitionIdInput
  def input(wrapper_options)
    comment_field = @builder.text_field(:comments, placeholder: "Indicate incident(s) number(s) or comments here", class: "comments-input")
    link_html = @options.delete(:link_html) || ""
    super + comment_field + link_html
  end
end
