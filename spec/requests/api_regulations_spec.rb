# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API Regulations" do
  let(:erb_fragment) do
    <<~HTML
      <% provide(:title, 'WCA Regulations') %>
      <div class="container"><h1>WCA Regulations</h1>
      <ul>
      <li id="1a"><a href="#1a">1a</a>) A competition must include a WCA Delegate.</li>
      </ul></div>
    HTML
  end

  def stub_static_site(path)
    stub_request(:get, "#{Api::V0::RegulationsController::REGULATIONS_STATIC_SITE}/#{path}")
      .to_return(status: 200, body: erb_fragment, headers: { 'Content-Type' => 'text/html' })
  end

  describe "GET /api/v0/regulations" do
    it "returns the rendered HTML fragment with anchors preserved" do
      stub = stub_static_site("index.html")

      get api_v0_regulations_path

      expect(response).to be_successful
      content = response.parsed_body["content_html"]
      # deep-link anchor is preserved ...
      expect(content).to include('id="1a"')
      # ... and the leading ERB tag is consumed by rendering
      expect(content).not_to include("provide(:title")
      expect(stub).to have_been_requested
    end
  end

  describe "GET /api/v0/regulations/history/official/:version" do
    it "fetches the requested historical version" do
      stub = stub_static_site("history/official/2024/index.html")

      get api_v0_regulations_historical_path(version: "2024")

      expect(response).to be_successful
      expect(response.parsed_body["content_html"]).to include('id="1a"')
      expect(stub).to have_been_requested
    end
  end

  describe "GET /api/v0/regulations/translations/:language" do
    it "fetches the requested translation" do
      stub = stub_static_site("translations/chinese/index.html")

      get api_v0_regulations_translation_path(language: "chinese")

      expect(response).to be_successful
      expect(response.parsed_body["content_html"]).to include('id="1a"')
      expect(stub).to have_been_requested
    end
  end
end
