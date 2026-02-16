# frozen_string_literal: true

class PostsController < ApplicationController
  include TagsHelper

  before_action :authenticate_user!, except: %i[homepage index rss show]
  before_action -> { redirect_to_root_unless_user(:can_create_posts?) }, except: %i[homepage index rss show]
  before_action -> { redirect_to_root_unless_user(:can_administrate_livestream?) }, only: %i[livestream_management update_test_link promote_test_link]
  POSTS_PER_PAGE = 10

  def index
    respond_to do |format|
      format.json do
        tag = params[:tag]
        @posts = if tag
                   Post.joins(:post_tags).where(post_tags: { tag: tag })
                 else
                   Post.where(show_on_homepage: true)
                 end
        @posts = @posts
                 .order(sticky: :desc, created_at: :desc)
                 .includes(:author)
                 .page(params[:page])
                 .per(POSTS_PER_PAGE)
        render json: {
          totalPages: @posts.total_pages,
          posts: @posts.as_json(
            can_manage: current_user&.can_create_posts?,
            teaser_only: true,
          ),
        }
      end
      format.html do
        @current_page = (params[:page] || 1).to_i
        render :index
      end
    end
  end

  def homepage
    @latest_post = Post.order(sticky: :desc, created_at: :desc).first
    @preview = params[:preview] == "1" && current_user&.can_administrate_livestream?
    @video_id = if @preview
                  ServerSetting.find_by(name: ServerSetting::TEST_VIDEO_ID_NAME)&.value
                else
                  ServerSetting.find_by(name: ServerSetting::LIVE_VIDEO_ID_NAME)&.value
                end
  end

  def livestream_management
    @test_video_id = ServerSetting.find_or_create_by(name: ServerSetting::TEST_VIDEO_ID_NAME)&.value
    @live_video_id = ServerSetting.find_or_create_by(name: ServerSetting::LIVE_VIDEO_ID_NAME)&.value
  end

  def update_test_link
    new_value = params[:new_test_value]
    test = ServerSetting.find(ServerSetting::TEST_VIDEO_ID_NAME)

    if test.update(value: new_value)
      render json: { data: test.value }
    else
      render json: { error: test.errors }
    end
  end

  # Sets the live link to the value of the current test link
  def promote_test_link
    test = ServerSetting.find(ServerSetting::TEST_VIDEO_ID_NAME).value
    live = ServerSetting.find(ServerSetting::LIVE_VIDEO_ID_NAME)
    if live.update(value: test)
      render json: { data: live.value }
    else
      render json: { error: live.errors }
    end
  end

  def rss
    tag = params[:tag]
    @posts = if tag
               Post.joins(:post_tags).where(post_tags: { tag: tag })
             else
               Post
             end
    @posts = @posts.order(created_at: :desc).includes(:author).page(params[:page])

    # Force responding with xml, regardless of the given HTTP_ACCEPT headers.
    request.format = :xml
    respond_to :xml
  end

  def show
    @post = find_post
  end

  def new
    @post = Post.new(params[:post] ? post_params : {})
  end

  def edit
    @post = find_post
  end

  def create
    @post = Post.new(post_params)
    @post.author = current_user
    if @post.save
      flash[:success] = "Created new post"
      render json: { status: 'ok', post: @post }
    else
      render json: { status: 'validation failed', errors: @post.errors }, status: :bad_request
    end
  end

  def update
    @post = find_post
    if @post.update(post_params)
      flash[:success] = "Updated post"
      render json: { status: 'ok', post: @post }
    else
      render json: { status: 'validation failed', errors: @post.errors }, status: :bad_request
    end
  end

  def destroy
    @post = find_post
    @post.destroy
    flash[:success] = "Deleted post"
    redirect_to root_url
  end

  private def editable_post_fields
    %i[title body sticky unstick_at tags show_on_homepage]
  end
  helper_method :editable_post_fields

  private def post_params
    params.expect(post: [*editable_post_fields])
  end

  private def find_post
    # We explicitly query for slug rather than using an OR, because mysql does
    # weird things when searching for an id using a string:
    #  mysql> select id from posts where id="2014-foo";
    #  +------+
    #  | id   |
    #  +------+
    #  | 2014 |
    #  +------+
    #  1 row in set, 1 warning (0.00 sec)
    post = Post.find_by(slug: params[:id]) || Post.find_by(id: params[:id])
    raise ActiveRecord::RecordNotFound.new("Couldn't find post") unless post

    post
  end
end
