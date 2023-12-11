# frozen_string_literal: true

class PanelController < ApplicationController
  include DocumentsHelper

  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:staff_or_any_delegate?) }
  before_action -> { redirect_to_root_unless_user(:can_view_senior_delegate_material?) }, only: [:pending_claims_for_subordinate_delegates]
  before_action -> { redirect_to_root_unless_user(:can_admin_finances?) }, only: [:wfc]
  before_action -> { redirect_to_root_unless_user(:can_access_board_panel?) }, only: [:board]

  def index
  end

  def pending_claims_for_subordinate_delegates
    # Show pending claims for a given user, or the current user, if they can see them
    @user = User.includes(subordinate_delegates: [:confirmed_users_claiming_wca_id]).find_by_id!(params[:user_id] || current_user.id)
    @subordinate_delegates = @user.subordinate_delegates.to_a.push(@user)
  end

  private def editable_post_fields
    [:body]
  end
  helper_method :editable_post_fields

  private def post_params
    params.require(:post).permit(*editable_post_fields)
  end

  def wfc
  end

  def board
  end
end
