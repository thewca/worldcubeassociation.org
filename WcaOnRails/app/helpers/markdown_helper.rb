module MarkdownHelper
  class WcaMarkdownRenderer < Redcarpet::Render::HTML
    def table(header, body)
      t = "<table class='table'>\n"
      t << "<thead>" + header + "</thead>\n" if header
      t << "<tbody>" + body + "</tbody>\n" if body
      t << "</table>"
      t
    end

    def postprocess(full_document)
      full_document.gsub!(/map\(([^)]*)\)/) do
        google_maps_url = "https://www.google.com/maps/embed/v1/place?key=AIzaSyCTTbqJwwOOKlNL6iPC_Kfz59GGKE2NEV0&q=#{URI.escape($1)}"
        "<iframe width='600' height='450' frameborder='0' style='border:0' src='#{google_maps_url}'></iframe>"
      end
      full_document
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
