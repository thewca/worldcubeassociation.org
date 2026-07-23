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

  before do
    allow(RegulationsS3Helper).to receive(:fetch_regulations_from_s3).and_return(erb_fragment)
  end

  describe "GET /api/v0/regulations" do
    it "returns the rendered HTML fragment with anchors preserved" do
      get api_v0_regulations_path

      expect(response).to be_successful
      content = response.parsed_body["content_html"]
      # deep-link anchor is preserved ...
      expect(content).to include('id="1a"')
      # ... and the leading ERB tag is consumed by rendering
      expect(content).not_to include("provide(:title")
      expect(RegulationsS3Helper).to have_received(:fetch_regulations_from_s3)
        .with("index.html.erb", RegulationsController::REGULATIONS_VERSION_FILE)
    end
  end

  describe "GET /api/v0/regulations/history/official/:version" do
    it "fetches the requested historical version" do
      get api_v0_regulations_historical_path(version: "2024")

      expect(response).to be_successful
      expect(response.parsed_body["content_html"]).to include('id="1a"')
      expect(RegulationsS3Helper).to have_received(:fetch_regulations_from_s3)
        .with("history/official/2024/index.html.erb", RegulationsController::REGULATIONS_VERSION_FILE)
    end
  end

  describe "GET /api/v0/regulations/translations/:language" do
    it "fetches the requested translation using the translations version file" do
      get api_v0_regulations_translation_path(language: "chinese")

      expect(response).to be_successful
      expect(response.parsed_body["content_html"]).to include('id="1a"')
      expect(RegulationsS3Helper).to have_received(:fetch_regulations_from_s3)
        .with("translations/chinese/index.html.erb", RegulationsTranslationsController::REGULATIONS_TRANSLATIONS_VERSION_FILE)
    end
  end
end
