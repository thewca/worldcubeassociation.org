# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Error pages" do
  before do
    allow(Rails.application).to receive(:env_config).and_wrap_original do |original|
      original.call.merge(
        "action_dispatch.show_exceptions" => :all,
        "action_dispatch.show_detailed_exceptions" => false,
      )
    end

    # `config.exceptions_app` is only set in production, so the test stack falls back to this default.
    allow_any_instance_of(ActionDispatch::PublicExceptions).to receive(:call) do |_, env|
      ErrorsController.action(:show).call(env)
    end
  end

  shared_examples "HTML error page" do |path, expected_status|
    it "renders #{path} as HTML with status #{expected_status}" do
      get path

      expect(response).to have_http_status(expected_status)
      expect(response.media_type).to eq "text/html"
    end
  end

  context "when no route matches" do
    it_behaves_like "HTML error page", "/no-such-page", :not_found
    it_behaves_like "HTML error page", "/no-such-icon.svg", :not_found
    it_behaves_like "HTML error page", "/no-such-icon.png", :not_found
    it_behaves_like "HTML error page", "/no-such-data.json", :not_found

    it "keeps responding with JSON to API requests" do
      get "/api/no-such-endpoint"

      expect(response).to have_http_status(:not_found)
      expect(response.media_type).to eq "application/json"
    end
  end

  context "when the request fails unexpectedly" do
    before { allow_any_instance_of(CompetitionsController).to receive(:index).and_raise("Unexpected failure") }

    it_behaves_like "HTML error page", "/competitions", :internal_server_error
    it_behaves_like "HTML error page", "/competitions.json", :internal_server_error
  end
end
