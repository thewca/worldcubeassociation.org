require "rails_helper"

describe "rss" do
  include Rack::Test::Methods

  let!(:post_1) { FactoryGirl.create :post,
                                     body: 'foo **a**',
                                     title: 'bar',
                                     created_at: DateTime.new(2014, 3, 12, 12, 32, 42) }
  let!(:post_2) { FactoryGirl.create :sticky_post,
                                     body: '[link](http://google.de)',
                                     title: 'sticky post',
                                     created_at: DateTime.new(2014, 3, 14, 11, 18, 00) }

  describe "posts" do
    before do
      get rss_path, format: :xml
    end

    it "returns all titles" do
      titles = xml_contents_at('rss/channel/item/title')

      expect(titles).to eq ['sticky post', 'bar']
    end

    it "returns all descriptions converted to HTML and wrapped in CDATA" do
      descriptions = xml_contents_at('rss/channel/item/description')

      expect(descriptions).to eq ["<![CDATA[<p><a href=\"http://google.de\">link</a></p>\n]]>",
                                  "<![CDATA[<p>foo <strong>a</strong></p>\n]]>"]
    end

    it "returns all publication dates as rfc822" do
      pub_dates = xml_contents_at('rss/channel/item/pubDate')

      expect(pub_dates).to eq ['Fri, 14 Mar 2014 11:18:00 +0000', 'Wed, 12 Mar 2014 12:32:42 +0000']
    end
  end

  def xml_response
    Oga.parse_xml(last_response.body)
  end

  def xml_contents_at(xpath)
    xml_response.xpath(xpath).map(&:inner_text)
  end
end
