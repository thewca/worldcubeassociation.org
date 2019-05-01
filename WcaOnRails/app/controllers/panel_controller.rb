# frozen_string_literal: true

class PanelController < ApplicationController
  include DocumentsHelper

  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:staff?) }
  before_action -> { redirect_to_root_unless_user(:can_update_delegate_crash_course?) }, only: [:edit_delegate_crash_course, :update_delegate_crash_course]
  before_action -> { redirect_to_root_unless_user(:can_view_senior_delegate_material?) }, only: [:pending_claims_for_subordinate_delegates]
  before_action -> { redirect_to_root_unless_user(:board_member?) }, only: [:seniors]

  def index
  end

  def delegate_crash_course
    @post = Post.delegate_crash_course_post
    render 'posts/show'
  end

  def edit_delegate_crash_course
    @post = Post.delegate_crash_course_post
    render 'posts/edit'
  end

  def update_delegate_crash_course
    @post = Post.delegate_crash_course_post
    if @post.update_attributes(post_params)
      flash[:success] = "Updated crash course"
      redirect_to panel_delegate_crash_course_path
    else
      render 'edit'
    end
  end

  def pending_claims_for_subordinate_delegates
    # Show pending claims for a given user, or the current user, if they can see them
    @user = User.includes(subordinate_delegates: [:confirmed_users_claiming_wca_id]).find_by_id!(params[:user_id] || current_user.id)
    @subordinate_delegates = @user.subordinate_delegates.to_a.push(@user)
  end

  def seniors
    # Show the list of seniors and actions available
    @seniors = User.senior_delegates.order(:name)
  end

  private def editable_post_fields
    [:body]
  end
  helper_method :editable_post_fields

  private def post_params
    params.require(:post).permit(*editable_post_fields)
  end
end
