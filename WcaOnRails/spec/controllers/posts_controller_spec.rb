require 'rails_helper'

describe PostsController do
  before do
    @post = FactoryGirl.create(:post, created_at: 1.hours.ago)
    @sticky_post = FactoryGirl.create(:post, sticky: true, created_at: 2.hours.ago)
  end

  describe "GET #index" do
    it "populates an array of posts with sticky posts first" do
      get :index
      expect(assigns(:posts)).to eq [ @sticky_post, @post ]
    end
  end

  describe "GET #rss" do
    it "populates an array of posts ignoring sticky bit" do
      get :rss, format: :xml
      expect(assigns(:posts)).to eq [ @post, @sticky_post ]
    end
  end

  describe "GET #show" do
    it "finds a post by slug" do
      get :show, slug: @post.slug
      expect(assigns(:post)).to eq @post
    end
  end
end
