# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PanelController do
  describe "signed in as wrt member" do
    let(:wrt_member) { FactoryBot.create :user, :wrt_member }
    before :each do
      sign_in wrt_member
    end

    it "can view the delegate crash course" do
      get :delegate_crash_course
      expect(response.status).to eq 200
    end

    it "can edit the delegate crash course" do
      patch :update_delegate_crash_course, params: { post: { body: "a new body!" } }
      expect(Post.delegate_crash_course_post.body).to eq "a new body!"
    end
  end

  describe "signed in as delegate" do
    let(:delegate) { FactoryBot.create :delegate }
    before :each do
      sign_in delegate
    end

    it "can view the delegate crash course" do
      get :delegate_crash_course
      expect(response.status).to eq 200
    end

    it "can't edit the delegate crash course" do
      patch :update_delegate_crash_course, params: { post: { body: "a new body!" } }
      expect(response).to redirect_to root_path
    end
  end

  describe "signed in as senior delegate" do
    let(:senior_delegate) { FactoryBot.create :senior_delegate }
    before :each do
      sign_in senior_delegate
    end

    it "can view the delegate crash course" do
      get :delegate_crash_course
      expect(response.status).to eq 200
    end

    it "can't edit the delegate crash course" do
      patch :update_delegate_crash_course, params: { post: { body: "a new body!" } }
      expect(response).to redirect_to root_path
    end

    it "can view the pending claims for subordinate delegates" do
      get :pending_claims_for_subordinate_delegates
      expect(response.status).to eq 200
    end

    it "can't view the seniors list" do
      get :seniors
      expect(response).to redirect_to root_path
    end
  end

  describe "signed in as board member" do
    let(:board_member) { FactoryBot.create :user, :board_member }
    before :each do
      sign_in board_member
    end

    it "can view the delegate crash course" do
      get :delegate_crash_course
      expect(response.status).to eq 200
    end

    it "can edit the delegate crash course" do
      patch :update_delegate_crash_course, params: { post: { body: "a new body!" } }
      expect(Post.delegate_crash_course_post.body).to eq "a new body!"
    end

    it "can view the seniors list" do
      get :seniors
      expect(response.status).to eq 200
    end

    it "can view the pending claims for subordinate delegates of senior delegates" do
      get :pending_claims_for_subordinate_delegates
      expect(response.status).to eq 200
    end
  end
end
