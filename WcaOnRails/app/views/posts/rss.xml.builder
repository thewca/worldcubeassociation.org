# frozen_string_literal: true

xml.instruct! :xml, version: "1.0"
xml.rss version: "2.0", "xmlns:dc" => "http://purl.org/dc/elements/1.1/" do
  xml.channel do
    xml.title WcaOnRails::Application.config.site_name
    xml.description ""
    xml.link root_url

    @posts.each do |post|
      xml.item do
        xml.title post.title
        xml.description do
          xml << cdata_section(md(post.body_full))
        end
        xml.pubDate post.created_at.to_fs(:rfc822)
        xml.tag! "dc:creator", post.author.name

        full_post_url = post_url(post.slug)
        xml.link full_post_url
        xml.guid full_post_url
      end
    end
  end
end
