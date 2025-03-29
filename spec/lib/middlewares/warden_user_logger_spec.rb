# frozen_string_literal: true

DUMMY_SESSION_KEY = 'foobar'

RSpec.describe LogTagging do
  describe "user_log_tag" do
    before(:each) do
      expect(Rails.application.config).to receive(:session_options).and_return({ key: DUMMY_SESSION_KEY })
    end

    let(:cookie_jar) { double(:cookie_jar, encrypted: { DUMMY_SESSION_KEY => env }) }
    let(:request) { double(:request, cookie_jar: cookie_jar) }

    context "env filled with warden session information" do
      # Yes, the double `user` and the nested array is actually how it looks in real requests
      let(:env) { { 'warden.user.user.key' => [[42], "encrypted!"] } }

      it "logs the correct user id" do
        expect(subject.user_log_tag(request)).to eq "user:42"
      end
    end

    context "env not filled with warden session information" do
      let(:env) { {} } # Empty hash

      it "logs the absence of a logged in user" do
        expect(subject.user_log_tag(request)).to be_nil
      end
    end
  end
end
