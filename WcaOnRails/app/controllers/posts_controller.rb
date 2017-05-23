# frozen_string_literal: true

class PostsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :rss, :show]
  before_action -> { redirect_to_root_unless_user(:can_create_posts?) }, except: [:index, :rss, :show]

  def index
    @posts = Post.where(world_readable: true).order(sticky: :desc, created_at: :desc).includes(:author).page(params[:page])
  end

  def rss
    @posts = Post.where(world_readable: true).order(created_at: :desc).includes(:author).page(params[:page])

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

  def create
    @post = Post.new(post_params)
    @post.world_readable = true
    @post.author = current_user
    if @post.save
      flash[:success] = "Created new post"
      redirect_to post_path(@post.slug)
    else
      render 'new'
    end
  end

  def edit
    @post = find_post
  end

  def update
    @post = find_post
    if @post.update_attributes(post_params)
      flash[:success] = "Updated post"
      redirect_to post_path(@post.slug)
    else
      render 'edit'
    end
  end

  def destroy
    @post = find_post
    @post.destroy
    flash[:success] = "Deleted post"
    redirect_to root_url
  end

  private def editable_post_fields
    [:title, :body, :sticky, :tags]
  end
  helper_method :editable_post_fields

  private def post_params
    params.require(:post).permit(*editable_post_fields)
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
    post = Post.find_by_slug(params[:id]) || Post.find_by_id(params[:id])
    if !post || !post.world_readable
      raise ActiveRecord::RecordNotFound.new("Couldn't find post")
    end
    post
  end
end
