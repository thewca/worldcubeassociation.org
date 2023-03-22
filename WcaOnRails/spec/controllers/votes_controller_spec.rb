# frozen_string_literal: true

require 'rails_helper'

RSpec.describe VotesController do
  let(:poll) { FactoryBot.create(:poll, :confirmed) }

  context "not logged in" do
    it "redirects to sign in" do
      post :create
      expect(response).to redirect_to(new_user_session_path)
    end
  end

  context "logged in as a regular user" do
    sign_in { FactoryBot.create(:user) }
    it "redirects to home page" do
      post :create
      expect(response).to redirect_to(root_url)
    end
  end

  context "logged in as delegate" do
    let!(:delegate) { FactoryBot.create :delegate }
    before :each do
      sign_in delegate
    end

    describe "POST #create" do
      it "creates and updates a vote" do
        post :create, params: { vote: { poll_option_ids: [poll.poll_options.first.id], poll_id: poll.id } }
        vote = Vote.find_by_user_id(delegate.id)
        expect(vote.poll_options.length).to eq 1
        expect(vote.poll_options.first.id).to eq poll.poll_options.first.id

        post :update, params: { id: vote.id, vote: { poll_option_ids: [poll.poll_options[1].id], poll_id: poll.id } }
        vote.reload
        expect(vote.poll_options.length).to eq 1
        expect(vote.poll_options.first.id).to eq poll.poll_options[1].id
      end

      it "creates and updates multiple votes" do
        multiple_poll = FactoryBot.create(:poll, :confirmed, :multiple)

        post :create, params: { vote: { poll_option_ids: multiple_poll.poll_options.pluck(:id), poll_id: multiple_poll.id } }
        vote = Vote.find_by_user_id(delegate.id)
        expect(vote.poll_options.pluck(:id).sort).to eq multiple_poll.poll_options.pluck(:id).sort

        post :update, params: { id: vote.id, vote: { poll_option_ids: [multiple_poll.poll_options.first.id], poll_id: multiple_poll.id } }
        vote.reload
        expect(vote.poll_options.length).to eq 1
      end
    end
  end

  context "logged in as staff member" do
    let!(:staff_member) { FactoryBot.create :user, :wrt_member }
    before :each do
      sign_in staff_member
    end

    describe "POST #create" do
      it "creates and updates a vote" do
        post :create, params: { vote: { poll_option_ids: [poll.poll_options.first.id], poll_id: poll.id } }
        vote = Vote.find_by_user_id(staff_member.id)
        expect(vote.poll_options.length).to eq 1
        expect(vote.poll_options.first.id).to eq poll.poll_options.first.id

        post :update, params: { id: vote.id, vote: { poll_option_ids: [poll.poll_options[1].id], poll_id: poll.id } }
        vote.reload
        expect(vote.poll_options.length).to eq 1
        expect(vote.poll_options.first.id).to eq poll.poll_options[1].id
      end

      it "creates and updates multiple votes" do
        multiple_poll = FactoryBot.create(:poll, :confirmed, :multiple)

        post :create, params: { vote: { poll_option_ids: multiple_poll.poll_options.pluck(:id), poll_id: multiple_poll.id } }
        vote = Vote.find_by_user_id(staff_member.id)
        expect(vote.poll_options.pluck(:id).sort).to eq multiple_poll.poll_options.pluck(:id).sort

        post :update, params: { id: vote.id, vote: { poll_option_ids: [multiple_poll.poll_options.first.id], poll_id: multiple_poll.id } }
        vote.reload
        expect(vote.poll_options.length).to eq 1
      end
    end
  end
end
