# frozen_string_literal: true

class DelegatesController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to root unless user.can_view_delegate_matters? }, only: [:stats]
  before_action -> { redirect_to root_url unless current_user_is_authorized? }, only: [:delegate_probation_data, :probations]
  before_action :current_user_is_authorized_for_action!, only: [:delegate_probation_data, :start_delegate_probation, :end_delegate_probation]
  private def current_user_is_authorized_for_action!
    unless current_user_is_authorized?
      render json: {}, status: 401
    end
  end

  def stats
    @delegates = User.delegates.includes(:actually_delegated_competitions)
  end

  private def current_user_is_authorized?
    current_user.senior_delegate? || current_user.team_leader?(Team.wfc) || current_user.team_senior_member?(Team.wfc)
  end

  def delegate_probation_data
    respond_to do |format|
      format.json do
        @probation_roles = Role.where(group_id: UserGroup.where(group_type: "delegate_probation"))
        user_ids = @probation_roles.pluck(:user_id)
        @probation_users = User.find(user_ids).index_by(&:id)
        render json: {
          probationUsers: @probation_users,
          probationRoles: @probation_roles,
        }
      end
    end
  end

  def start_delegate_probation
    respond_to do |format|
      format.json do
        wca_id = params[:wcaId]
        user = User.find_by_wca_id!(wca_id)
        Role.create!(
          user_id: user.id,
          group_id: UserGroup.find_by!(name: "Delegate Probation").id,
          start_date: Date.today,
        )
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
        role = Role.find_by_id(probation_role_id)
        role.update!(end_date: Date.safe_parse(params[:endDate]))
        render json: {
          success: true,
        }
      end
    end
  end
end
