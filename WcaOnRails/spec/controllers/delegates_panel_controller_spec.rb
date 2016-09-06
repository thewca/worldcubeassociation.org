# frozen_string_literal: true
require 'rails_helper'

describe DelegatesPanelController do
  describe "signed in as results team member" do
    let(:results_team_user) { FactoryGirl.create :results_team }
    before :each do
      sign_in results_team_user
    end

    it "can edit" do
      patch :update_crash_course, post: { body: "a new body!" }
      expect(Post.crash_course_post.body).to eq "a new body!"
    end

    it "can view" do
      get :crash_course
      expect(response.status).to eq 200
    end
  end

  describe "signed in as delegate" do
    let(:delegate) { FactoryGirl.create :delegate }
    before :each do
      sign_in delegate
    end

    it "can't edit" do
      patch :update_crash_course, post: { body: "a new body!" }
      expect(response).to redirect_to root_path
    end

    it "can view" do
      get :crash_course
      expect(response.status).to eq 200
    end
  end
end
