# frozen_string_literal: true
require 'rails_helper'

describe PollsController do

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

  context "logged in as board member" do
    let(:board_member) { FactoryGirl.create :board_member }
    before :each do
      sign_in board_member
    end

    describe "POSTS" do
      it "creates a poll" do
        post :create, poll: { question: "Hello?"}
        poll = assigns(:poll)
        expect(response).to redirect_to edit_poll_path(poll.id)
        expect(poll.question).to eq "Hello?"
      end

      it "edits a poll" do
        poll = FactoryGirl.create(:poll)
        post :update, id: poll.id, poll: { question: "Pedro" , multiple: true, deadline: '2016-03-15' }
        poll.reload
        expect(poll.question).to eq "Pedro"
        expect(poll.multiple?).to eq true
        expect(poll.deadline).to eq '2016-03-15'.to_date
      end

      it "add two options and confirm" do
        poll = FactoryGirl.create(:poll)
        post :update, id: poll.id, poll: { poll_options_attributes: { "1" => {description: "Yes"}, "2" => {description: "No"} } }
        poll.reload
        expect(poll.poll_options.length).to eq 2
        expect(poll.poll_options[0].description).to eq "Yes"
        expect(poll.poll_options[1].description).to eq "No"

        post :update, id: poll.id, poll: { question: poll.question }, commit: "Confirm"
        poll.reload
        expect(poll.confirmed?).to eq true
      end

      it "removes an option and try to confirm" do
        poll = FactoryGirl.create(:poll)
        post :update, id: poll.id, poll: { poll_options_attributes: { "1" => {description: "Yes"}, "2" => {description: "No"} } }
        poll.reload
        second_option_id = poll.poll_options[1].id
        post :update, id: poll.id, poll: { poll_options_attributes: { "3" => {id: poll.poll_options.first.id, _destroy: true} } }
        poll.reload
        expect(poll.poll_options.length).to eq 1
        expect(poll.poll_options.first.id).to eq second_option_id
        expect(poll.poll_options.first.description).to eq "No"

        post :update, id: poll.id, poll: { question: poll.question }, commit: "Confirm"
        poll.reload
        expect(poll.confirmed?).to eq false
      end

      it "can't edit a confirmed poll, except for deadline" do
        poll = FactoryGirl.create(:poll, :confirmed)
        post :update, id: poll.id, poll: { multiple: true }
        invalid_poll = assigns :poll
        poll.reload
        expect(poll.multiple).to eq false
        expect(invalid_poll.errors[:deadline]).to eq ["you can only change the deadline"]
      end

      it "can change deadline of a confirmed poll" do
        poll = FactoryGirl.create(:poll, :confirmed)
        new_deadline = Date.today - 1
        post :update, id: poll.id, poll: { deadline: new_deadline }
        poll.reload
        expect(poll.deadline).to eq new_deadline
      end

      it "can delete an unconfirmed poll" do
        poll = FactoryGirl.create(:poll)
        post :destroy, id: poll.id
        expect(Poll.find_by_id(poll.id)).to eq nil
      end

      it "can't delete a confirmed poll" do
        poll = FactoryGirl.create(:poll, :confirmed)
        post :destroy, id: poll.id
        expect(Poll.find_by_id(poll.id)).not_to eq nil
      end

      it "deadline defaults to now if you don't change it" do
        poll = FactoryGirl.create(:poll)
        post :update, id: poll.id, poll: { deadline: poll.deadline, poll_options_attributes: { "1" => {description: "Yes"}, "2" => {description: "No"} } }
        new_poll = assigns :poll
        poll.reload
        expect(new_poll.deadline).to eq poll.deadline
      end
    end
  end
end
