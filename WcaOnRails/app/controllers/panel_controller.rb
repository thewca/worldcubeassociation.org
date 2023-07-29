# frozen_string_literal: true

class PanelController < ApplicationController
  include DocumentsHelper

  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:staff?) }
  before_action -> { redirect_to_root_unless_user(:can_view_senior_delegate_material?) }, only: [:pending_claims_for_subordinate_delegates]
  before_action -> { redirect_to_root_unless_user(:board_member?) }, only: [:seniors]

  def index
  end

  def pending_claims_for_subordinate_delegates
    # TO_VERIFY
    # Didn't understand what was the purpose of .includes(subordinate_delegates: [:confirmed_users_claiming_wca_id])
    # but I think it's not important.
    @user = User.find_by_id!(params[:user_id] || current_user.id)
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
