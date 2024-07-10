# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PostsController do
  let!(:post1) { FactoryBot.create(:post, created_at: 1.hours.ago) }
  let!(:sticky_post) { FactoryBot.create(:post, sticky: true, created_at: 2.hours.ago) }
  let!(:wdc_post) { FactoryBot.create(:post, created_at: 3.hours.ago, tags: 'wdc,othertag', show_on_homepage: false) }

  context 'not logged in' do
    describe 'GET #index' do
      it 'populates an array of posts with sticky posts first' do
        get :index, format: :json
        expect(assigns(:posts)).to eq [sticky_post, post1]
      end

      it 'filters by tag' do
        get :index, params: { tag: 'wdc' }, format: :json
        expect(assigns(:posts)).to eq [wdc_post]
      end
    end

    describe 'GET #rss' do
      it 'populates an array of posts ignoring sticky bit' do
        get :rss, format: :xml
        expect(assigns(:posts).to_a).to eq [post1, sticky_post, wdc_post]
      end

      it 'filters by tag' do
        get :rss, format: :xml, params: { tag: 'wdc' }
        expect(assigns(:posts).to_a).to eq [wdc_post]
      end
    end

    describe 'GET #show' do
      it 'finds a post by slug' do
        get :show, params: { id: post1.slug }
        expect(assigns(:post)).to eq post1
      end

      it 'only matches exact ids' do
        post2 = FactoryBot.create(:post)
        post2.update_attribute(:slug, "#{post1.id}-foo")

        post1 = FactoryBot.create(:post)
        post1.update_attribute(:slug, "#{post2.id}-foo")

        get :show, params: { id: post2.slug }
        expect(assigns(:post)).to eq post2

        get :show, params: { id: post1.slug }
        expect(assigns(:post)).to eq post1
      end
    end

    describe 'GET #new' do
      it 'redirects to login' do
        get :new
        expect(response).to redirect_to new_user_session_path
      end
    end

    describe 'POST #create' do
      it 'redirects to login' do
        post :create
        expect(response).to redirect_to new_user_session_path
      end
    end
  end

  context 'logged in as wrc member' do
    sign_in { FactoryBot.create :user, :wrc_member }

    describe 'GET #new' do
      it 'works' do
        get :new
        expect(response.status).to eq 200
      end
    end

    describe 'POST #create' do
      it 'creates a post' do
        post :create, params: { post: { title: 'Title', body: 'body' } }
        p = Post.find_by_slug('Title')
        expect(p.title).to eq 'Title'
        expect(p.body).to eq 'body'
      end
    end
  end

  context 'logged in as wdc member' do
    sign_in { FactoryBot.create :user, :wdc_member }

    describe 'GET #new' do
      it 'returns 200' do
        get :new
        expect(response.status).to eq 200
      end
    end

    describe 'POST #create' do
      it 'creates a tagged post' do
        post :create, params: { post: { title: 'Title', body: 'body', tags: 'wdc, notes' } }
        p = Post.find_by_slug('Title')
        expect(p.title).to eq 'Title'
        expect(p.body).to eq 'body'
        expect(p.tags_array).to match_array %w(wdc notes)
      end
    end
  end
end
