module MarkdownHelper
  class WcaMarkdownRenderer < Redcarpet::Render::HTML
    def table(header, body)
      t = "<table class='table'>\n"
      t << "<thead>" + header + "</thead>\n" if header
      t << "<tbody>" + body + "</tbody>\n" if body
      t << "</table>"
      t
    end
  end

  def md(content, target_blank: false)
    if content.nil?
      return ""
    end

    options = {
      escape_html: true,
      hard_wrap: true,
    }

    extensions = {
      tables: true,
    }

    if target_blank
      options[:link_attributes] = { target: "_blank" }
    end

    Redcarpet::Markdown.new(WcaMarkdownRenderer.new(options), extensions).render(content).html_safe
  end
end
