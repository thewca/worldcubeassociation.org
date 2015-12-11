require 'rails_helper'

describe VotesController do
  let(:poll) { FactoryGirl.create(:confirmed_poll) }

  context "not logged in" do
    it "redirects to sign in" do
      post :create
      expect(response).to redirect_to(new_user_session_path)
    end
  end

  context "logged in as a regular user" do
    sign_in { FactoryGirl.create(:user) }
    it "redirects to home page" do
      post :create
      expect(response).to redirect_to(root_url)
    end
  end

  context "logged in as delegate" do
    let(:delegate) { FactoryGirl.create :delegate }
    before :each do
      sign_in delegate
    end

    describe "POST #create" do
      it "creates a vote" do
        post :create, vote: { poll_option_id: poll.poll_options.first.id, poll_id: poll.id }
        v = Vote.find_by_user_id(delegate.id)
        expect(v.poll_option_id).to eq poll.poll_options.first.id
      end

      it "creates multiple votes" do
        poll.multiple = true
        poll.save!

        post :create, vote: { poll_option_id: poll.poll_options.pluck(:id), poll_id: poll.id}
        votes = Vote.where(user_id: delegate.id)
        expect(votes.pluck(:poll_option_id).sort).to eq poll.poll_options.pluck(:id).sort
      end
    end
  end
end
