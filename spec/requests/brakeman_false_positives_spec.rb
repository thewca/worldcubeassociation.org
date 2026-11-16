# frozen_string_literal: true

require "rails_helper"

# Every entry in config/brakeman.ignore must either be tagged with `brakeman:` on a describe block below,
#   or be listed here because its interpolated values are hardcoded and never reachable from a request.
UNTESTABLE_BRAKEMAN_FINGERPRINTS = {
  "213c9ba0468beba064b5f4a6433b9ea2fdd08a582a12eb377aa4c41233a65597" => "lib/database_dumper.rb",
  "c1990aadae8a29e190e583d8bac128d4d948ecef487bd453119eed25c1b9df7d" => "lib/database_dumper.rb",
  "64c543fba94488b0a0940b9146487d7ffb49db4844738437a77b143461d96a15" => "app/controllers/server_status_controller.rb",
}.freeze

RSpec.describe "Brakeman false positives" do
  it "covers every ignored warning with a test or an explicit untestable entry" do
    ignored_fingerprints = JSON.parse(Rails.root.join("config/brakeman.ignore").read)["ignored_warnings"].pluck("fingerprint")
    tested_fingerprints = self.class.descendants.filter_map { |group| group.metadata[:brakeman] }.uniq

    expect(tested_fingerprints + UNTESTABLE_BRAKEMAN_FINGERPRINTS.keys).to match_array(ignored_fingerprints)
  end
  describe "RegistrationsController#redirect_v2_attendee", brakeman: "1592fd74a5c4d475d5ab2fa8c25aa56bf22d675e65d7268fc90565b3c164a32c" do
    let(:registration) { create(:registration) }

    before { sign_in create(:admin) }

    it "redirects for a matching registration" do
      get "/competitions/registrations_v2/#{registration.competition_id}/#{registration.user_id}/edit"

      expect(response).to redirect_to edit_registration_path(registration)
    end

    it "treats an injected user_id as a plain value" do
      expect do
        get "/competitions/registrations_v2/#{registration.competition_id}/0%20OR%201=1/edit"
      end.to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  describe "CompetitionsController#show as PDF", brakeman: "2f2711fc1b8e62d155e38e05e93f66cc9410d9f04ece678c67262c2f10debd74" do
    it "does not route path traversal ids" do
      expect { get "/competitions/..%2F..%2Fetc%2Fpasswd.pdf" }.to raise_error(ActionController::RoutingError)
    end

    it "only builds the PDF path from a competition that exists in the database" do
      expect { get "/competitions/DoesNotExist2026.pdf" }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  describe "Api::V0::CompetitionsController#check_wcif", brakeman: "ce44539daa5c183f2c48d42fbabe7b7ae4d365cc0dbb4d98a9d36e9eea94e44e" do
    let(:competition) { create(:competition, :with_delegate, :visible) }

    it "rejects keys that are not part of the WCIF schema" do
      wcif = competition.to_wcif.merge("results_posted_at" => Time.now.iso8601)

      put "/api/v0/competitions/wcif/check", params: wcif, as: :json

      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "Api::V0::CompetitionsController#update_wcif", brakeman: "304f858c775c9c88c2cff48dd6d4064f3e3acfd22434d6c1f942999636d3c8a7" do
    let(:competition) { create(:competition, :with_delegate, :visible) }

    before { sign_in competition.delegates.first }

    it "rejects keys that are not part of the WCIF schema" do
      wcif = competition.to_wcif.merge("results_posted_at" => Time.now.iso8601)

      patch api_v0_competition_update_wcif_path(competition), params: wcif, as: :json

      expect(response).to have_http_status(:bad_request)
      expect(competition.reload.results_posted_at).to be_nil
    end
  end

  describe "CompetitionsController#update", brakeman: "42f8912db9163d219f00748efa87345ffa45411b0404d2c6668235b385469cd8" do
    let(:competition) { create(:competition, :with_delegate, :future, :visible, :with_valid_schedule) }

    before { sign_in create(:admin) }

    it "does not mass-assign attributes outside the form schema" do
      update_params = competition.to_form_data.merge("id" => competition.id, "results_posted_at" => Time.now.iso8601)

      patch competition_path(competition), params: update_params, as: :json

      expect(competition.reload.results_posted_at).to be_nil
    end
  end

  describe "RegulationsController#ensure_trailing_slash", brakeman: "60772c7d1d2eaf491d191c8adc7f73aa5c8bc0bcb65fa166c1a6bd9711ddfe11" do
    it "never redirects to a host taken from the params" do
      get "/regulations", params: { host: "evil.example", protocol: "javascript" }

      expect(response).to have_http_status(:moved_permanently)
      expect(URI.parse(response.location)).to have_attributes(scheme: "http", host: "www.example.com", path: "/regulations/")
    end
  end

  describe "Competition.has_event via the competitions API", brakeman: "fdb76c2784787dc4154cd1e973b3b2b1b93bc7dbd24c89ba8c272adae77e5b78" do
    it "rejects event ids that are not real events" do
      get api_v0_competitions_path, params: { event_ids: ["333) OR 1=1 -- "] }

      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
