# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "only WCT" do |action, expect_success|
  context "when not signed in" do
    it "redirects to sign in page" do
      self.instance_exec(&action)
      expect(response).to redirect_to new_user_session_path
    end
  end

  context "when signed in as regular user" do
    sign_in { FactoryBot.create :user }

    it "redirects to home page" do
      self.instance_exec(&action)
      expect(response).to redirect_to root_url
    end
  end

  context "when signed in as a WCT member" do
    before :each do
      sign_in FactoryBot.create :user, :wct_member
    end

    it 'can perform action' do
      self.instance_exec(&action)
      self.instance_exec(&expect_success)
    end
  end
end

RSpec.describe "media" do
  let(:competition) { FactoryBot.create(:competition, :with_delegate, :visible) }
  let!(:medium) { FactoryBot.create(:competition_medium, text: "i am pending") }
  let!(:accepted_medium) { FactoryBot.create(:competition_medium, :accepted, text: "i am accepted") }

  describe 'GET #validate' do
    it_should_behave_like 'only WCT',
                          lambda { get media_validate_path },
                          lambda { expect(response).to be_success }

    context "signed in as WCT member" do
      before :each do
        sign_in FactoryBot.create :user, :wct_member
      end

      it "shows only pending media by default" do
        get media_validate_path
        expect(response.body).to include "i am pending"
        expect(response.body).not_to include "i am accepted"
      end

      it "can show accepted media" do
        get media_validate_path, params: { status: "accepted" }
        expect(response.body).not_to include "i am pending"
        expect(response.body).to include "i am accepted"
      end
    end
  end

  describe "GET #edit" do
    it_should_behave_like 'only WCT',
                          lambda { get edit_medium_path(medium) },
                          lambda { expect(response).to be_success }
  end

  describe "PATCH #update" do
    let(:patch_medium) do
      lambda do |attributes|
        patch medium_path(medium), params: (attributes.map do |key, value|
          ["competition_medium[#{key}]", value]
        end.to_h)
      end
    end

    it_should_behave_like 'only WCT',
                          lambda { patch_medium.call(text: 'new text') },
                          lambda { expect(response).to redirect_to edit_medium_path(medium) }

    context "signed in as WCT member" do
      before :each do
        sign_in FactoryBot.create :user, :wct_member
      end

      it "can accept medium" do
        expect(medium.status).to eq "pending"
        patch_medium.call(status: 'accepted')
        expect(medium.reload.status).to eq "accepted"
      end

      it "can edit medium" do
        competition = FactoryBot.create :competition
        expect(medium.type).to eq 'article'

        patch_medium.call(
          competitionId: competition.id,
          type: 'multimedia',
          text: 'this is some new text',
          uri: 'http://newexample.com',
          submitterName: 'New Jeremy',
          submitterEmail: 'New@Jeremy',
          submitterComment: 'this is a new comment',
        )

        medium.reload
        expect(medium.competition).to eq competition
        expect(medium.type).to eq "multimedia"
        expect(medium.text).to eq "this is some new text"
        expect(medium.uri).to eq "http://newexample.com"
        expect(medium.submitterName).to eq "New Jeremy"
        expect(medium.submitterEmail).to eq "New@Jeremy"
        expect(medium.submitterComment).to eq "this is a new comment"
      end
    end
  end

  describe "DELETE #destroy" do
    let(:destroy_medium) { lambda { delete medium_path(medium) } }

    it_should_behave_like 'only WCT',
                          lambda { destroy_medium.call },
                          lambda {
                            expect(response).to redirect_to media_validate_path
                            expect(CompetitionMedium.find_by_id(medium.id)).to be_nil
                          }
  end
end
