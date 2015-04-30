xml.instruct! :xml, :version => "1.0"
xml.rss :version => "2.0", "xmlns:dc" => "http://purl.org/dc/elements/1.1/" do
  xml.channel do
    xml.title WcaOnRails::Application.config.site_name
    xml.description ""
    xml.link root_url

    for node in @nodes
      xml.item do
        xml.title node.title
        xml.description node.field_data_body.body_value
        xml.pubDate Time.at(node.created).to_s(:rfc822)
        xml.tag! "dc:creator", node.author.name

        full_node_url = node_url(node.alias)
        xml.link full_node_url
        xml.guid full_node_url
      end
    end
  end
end
