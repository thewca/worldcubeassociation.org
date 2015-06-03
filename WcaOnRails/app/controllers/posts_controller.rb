class PostsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :rss, :show]
  before_action :can_admin_results_only, except: [:index, :rss, :show]

  def index
    @posts = Post.order(sticky: :desc, created_at: :desc).paginate(page: params[:page])
  end

  def rss
    @posts = Post.order(created_at: :desc).paginate(page: params[:page])
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

  private def post_params
    params.require(:post).permit(:title, :body, :sticky)
  end

  private def can_admin_results_only
    unless current_user && current_user.can_admin_results?
      flash[:danger] = "You are not allowed to aministrate results"
      redirect_to root_url
    end
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
    post = Post.find_by_slug(params[:id]) || Post.find_by_id!(params[:id])
  end
end
