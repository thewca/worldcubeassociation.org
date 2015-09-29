class DelegatesPanelController < ApplicationController
  before_action :authenticate_user!
  before_action :delegates_only
  before_action :board_members_only, only: [:edit_crash_course, :update_crash_course]

  def index
  end

  def crash_course
    @post = Post.crash_course_post
    render 'posts/show'
  end

  def edit_crash_course
    @post = Post.crash_course_post
    render 'posts/edit'
  end

  def update_crash_course
    @post = Post.crash_course_post
    if @post.update_attributes(post_params)
      flash[:success] = "Updated crash course"
      redirect_to delegate_crash_course_path
    else
      render 'edit'
    end
  end

  private def editable_post_fields
    [:body]
  end
  helper_method :editable_post_fields

  private def post_params
    params.require(:post).permit(*editable_post_fields)
  end
end
