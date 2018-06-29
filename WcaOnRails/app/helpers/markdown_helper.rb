# frozen_string_literal: true

module MarkdownHelper
  class WcaMarkdownRenderer < Redcarpet::Render::HTML
    include ApplicationHelper

    def table(header, body)
      t = "<table class='table'>\n"
      t += "<thead>" + header + "</thead>\n" if header
      t += "<tbody>" + body + "</tbody>\n" if body
      t += "</table>"
      t
    end

    # This is annoying. Redcarpet implements this id generation logic in C, and
    # AFAIK doesn't provide any hook for calling this method directly from Ruby.
    # See C code here: https://github.com/vmg/redcarpet/blob/f441dec42a5097530328b20e9d5ed1a025c600f7/ext/redcarpet/html.c#L273-L319
    # Redcarpet issue here: https://github.com/vmg/redcarpet/issues/638.
    def header_anchor(text)
      Nokogiri::HTML(Redcarpet::Markdown.new(Redcarpet::Render::HTML.new(with_toc_data: true)).render("# #{text}")).css('h1')[0]["id"]
    end

    def header(text, header_level)
      if @options[:with_toc_data]
        id = header_anchor(text)
        text = anchorable(text, id)
      end

      "<h#{header_level}>#{text}</h#{header_level}>\n"
    end

    def postprocess(full_document)
      # Support embed Open Street Map
      full_document.gsub!(/map\(([^)]*)\)/) do
        "<iframe width='600' height='450' style='overflow: hidden' frameborder='0' style='border:0' src=\"#{embedded_map_url($1)}\"></iframe>"
      end

      # Support embed YouTube videos
      # Note: the URL in parentheses is turned into an <a></a> tag by the `autolink` extension.
      full_document.gsub!(/youtube\(.*?href="([^)]*)".*?\)/) do
        embed_url = $1.gsub("watch?v=", "embed/")
        "<iframe width='640' height='390' frameborder='0' src='#{embed_url}'></iframe>"
      end

      full_document
    end
  end

  def md(content, target_blank: false, toc: false)
    if content.nil?
      return ""
    end

    options = {
      escape_html: true,
      hard_wrap: true,
    }

    extensions = {
      tables: true,
      autolink: true,
      strikethrough: true,
    }

    if target_blank
      options[:link_attributes] = { target: "_blank" }
    end

    output = "".html_safe

    if toc
      options[:with_toc_data] = true
      output += Redcarpet::Markdown.new(Redcarpet::Render::HTML_TOC.new(options), extensions).render(content).html_safe
    end

    output += Redcarpet::Markdown.new(WcaMarkdownRenderer.new(options), extensions).render(content).html_safe
    output
  end
end
