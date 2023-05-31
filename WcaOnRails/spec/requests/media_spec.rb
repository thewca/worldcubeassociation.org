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

RSpec.shared_examples "must sign in" do |action, expect_success|
  context "when not signed in" do
    it "redirects to sign in page" do
      self.instance_exec(&action)
      expect(response).to redirect_to new_user_session_path
    end
  end

  context "when signed in as regular user" do
    let!(:user) { FactoryBot.create :user }

    before :each do
      sign_in user
    end

    it 'can perform action' do
      self.instance_exec(&action)
      self.instance_exec(user, &expect_success)
    end
  end
end

RSpec.describe "media" do
  let(:competition_2013) { FactoryBot.create(:competition, :with_delegate, :visible, starts: Date.new(2013, 4, 4)) }
  let!(:medium_2013) { FactoryBot.create(:competition_medium, :pending, competition: competition_2013, text: "i am from 2013 and pending") }
  let!(:accepted_medium_2013) { FactoryBot.create(:competition_medium, :accepted, competition: competition_2013, text: "i am from 2013 and accepted") }

  let(:competition) { FactoryBot.create(:competition, :with_delegate, :visible, country_id: "United Kingdom", city_name: "Peterborough, Cambridgeshire", starts: Date.today) }
  let!(:medium) { FactoryBot.create(:competition_medium, :pending, competition: competition, text: "i am pending") }
  let!(:accepted_medium) { FactoryBot.create(:competition_medium, :accepted, competition: competition, text: "i am accepted") }

  describe 'GET #new' do
    it_should_behave_like 'must sign in',
                          lambda { get new_medium_path },
                          lambda { |current_user| expect(response).to be_successful }
  end

  describe 'POST #create' do
    it_should_behave_like(
      'must sign in',
      lambda do
        post media_path, params: {
          'competition_medium[status]': "accepted", # This should get ignored and set to 'pending'

          # These should get ignored and set to the current user's information.
          'competition_medium[submitter_name]': "Jeremy",
          'competition_medium[submitter_email]': "jeremy@jflei.com",

          'competition_medium[competition_id]': competition_2013.id,
          'competition_medium[media_type]': 'report',
          'competition_medium[text]': 'i was just created',
          'competition_medium[link]': "https://www.jflei.com",
          'competition_medium[submitter_comment]': "this is a comment",
        }
      end,
      lambda do |current_user|
        medium = CompetitionMedium.find_by_text!("i was just created")
        expect(medium.status).to eq "pending"
        expect(medium.submitter_name).to eq current_user.name
        expect(medium.submitter_email).to eq current_user.email
      end,
    )
  end

  describe 'GET #index' do
    it "shows accepted media for current year" do
      get media_path
      expect(response.body).not_to include "i am pending"
      expect(response.body).not_to include "i am from 2013 and accepted"
      expect(response.body).to include "i am accepted"
    end

    describe "filter by year" do
      it "all years" do
        get media_path, params: { year: "all years" }

        expect(response.body).to include "i am from 2013 and accepted"
        expect(response.body).to include "i am accepted"
      end

      it "2013" do
        get media_path, params: { year: "2013" }

        expect(response.body).to include "i am from 2013 and accepted"
        expect(response.body).not_to include "i am accepted"
      end
    end

    describe "filter by region" do
      let!(:competition_us) { FactoryBot.create(:competition, :with_delegate, :visible, country_id: "USA", starts: Date.today) }
      let!(:medium_us) { FactoryBot.create(:competition_medium, :accepted, competition: competition_us, text: "i am in the us and accepted") }

      it "filters by country" do
        get media_path, params: { region: "USA" }

        expect(response.body).to include "i am in the us and accepted"
        expect(response.body).not_to include "i am accepted"
      end

      it "filters by continent" do
        get media_path, params: { region: "_North America" }

        expect(response.body).to include "i am in the us and accepted"
        expect(response.body).not_to include "i am accepted"
      end
    end
  end

  describe 'GET #validate' do
    it_should_behave_like 'only WCT',
                          lambda { get validate_media_path },
                          lambda { expect(response).to be_successful }

    context "signed in as WCT member" do
      before :each do
        sign_in FactoryBot.create :user, :wct_member
      end

      it "default shows only pending media for all years" do
        get validate_media_path
        expect(response.body).to include "i am pending"
        expect(response.body).to include "i am from 2013 and pending"
        expect(response.body).not_to include "i am accepted"
      end

      it "can show accepted media" do
        get validate_media_path, params: { status: "accepted" }
        expect(response.body).not_to include "i am pending"
        expect(response.body).to include "i am accepted"
      end
    end
  end

  describe "GET #edit" do
    it_should_behave_like 'only WCT',
                          lambda { get edit_medium_path(medium) },
                          lambda { expect(response).to be_successful }
  end

  describe "PATCH #update" do
    let(:patch_medium) do
      lambda do |attributes|
        patch medium_path(medium), params: (attributes.transform_keys do |key|
          "competition_medium[#{key}]"
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
        expect(medium.media_type).to eq 'article'

        patch_medium.call(
          competition_id: competition.id,
          media_type: 'multimedia',
          text: 'this is some new text',
          uri: 'http://newexample.com',
          submitter_name: 'New Jeremy',
          submitter_email: 'New@Jeremy',
          submitter_comment: 'this is a new comment',
        )

        medium.reload
        expect(medium.competition).to eq competition
        expect(medium.media_type).to eq "multimedia"
        expect(medium.text).to eq "this is some new text"
        expect(medium.uri).to eq "http://newexample.com"
        expect(medium.submitter_name).to eq "New Jeremy"
        expect(medium.submitter_email).to eq "New@Jeremy"
        expect(medium.submitter_comment).to eq "this is a new comment"
      end
    end
  end

  describe "DELETE #destroy" do
    let(:destroy_medium) { lambda { delete medium_path(medium) } }

    it_should_behave_like 'only WCT',
                          lambda { destroy_medium.call },
                          lambda {
                            expect(response).to redirect_to validate_media_path
                            expect(CompetitionMedium.find_by_id(medium.id)).to be_nil
                          }
  end
end
