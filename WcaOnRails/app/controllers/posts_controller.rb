class PostsController < ApplicationController
  def index
    @posts = Post.order(sticky: :desc, created_at: :desc).paginate(page: params[:page])
  end

  def rss
    @posts = Post.order(created_at: :desc).paginate(page: params[:page])
    respond_to :xml
  end

  def show
    @post = Post.find_by_slug(params[:slug])
  end
end
