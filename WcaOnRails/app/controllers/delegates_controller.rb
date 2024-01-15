# frozen_string_literal: true

class DelegatesController < ApplicationController
  before_action :authenticate_user!
  before_action :current_user_can_manage_delegate_probation!, only: [:end_delegate_probation]
  private def current_user_can_manage_delegate_probation!
    unless current_user.can_manage_delegate_probation?
      render json: {}, status: 401
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
