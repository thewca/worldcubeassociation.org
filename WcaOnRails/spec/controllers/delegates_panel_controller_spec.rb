# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DelegatesPanelController do
  describe "signed in as wrt member" do
    let(:wrt_member) { FactoryGirl.create :user, :wrt_member }
    before :each do
      sign_in wrt_member
    end

    it "can edit" do
      patch :update_crash_course, params: { post: { body: "a new body!" } }
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
      patch :update_crash_course, params: { post: { body: "a new body!" } }
      expect(response).to redirect_to root_path
    end

    it "can view" do
      get :crash_course
      expect(response.status).to eq 200
    end
  end
end
