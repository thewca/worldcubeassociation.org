# frozen_string_literal: true

class DelegatesController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_view_delegate_matters?) }, only: [:stats]
  before_action -> { redirect_to_root_unless_user(:can_manage_delegate_probation?) }, only: [:probations]
  before_action :current_user_can_manage_delegate_probation!, only: [:start_delegate_probation, :end_delegate_probation]
  private def current_user_can_manage_delegate_probation!
    unless current_user.can_manage_delegate_probation?
      render json: {}, status: 401
    end
  end

  def stats
    @delegates = User.delegates.includes(:actually_delegated_competitions)
  end

  def start_delegate_probation
    respond_to do |format|
      format.json do
        user_id = params[:userId]
        role = UserRole.create!(
          user_id: user_id,
          group_id: UserGroup.find_by!(name: "Delegate Probation").id,
          start_date: Date.today,
        )
        RoleChangeMailer.notify_start_probation(role, current_user).deliver_later
        render json: {
          success: true,
        }
      end
    end
  end

  def end_delegate_probation
    respond_to do |format|
      format.json do
        probation_role_id = params[:probationRoleId]
        role = UserRole.find_by_id(probation_role_id)
        role.update!(end_date: Date.safe_parse(params[:endDate]))
        RoleChangeMailer.notify_change_probation_end_date(role, current_user).deliver_later
        render json: {
          success: true,
        }
      end
    end
  end
end
