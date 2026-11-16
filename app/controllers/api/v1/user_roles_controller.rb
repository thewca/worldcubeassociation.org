# frozen_string_literal: true

class Api::V1::UserRolesController < Api::V1::ApiController
  # Active roles back public pages like Officers & Board or Teams & Committees.
  skip_before_action :require_user!

  def active
    roles = UserRole.active.includes(:user, :group)
    roles = roles.where(group: { group_type: params[:group_type] }) if params[:group_type].present?
    roles = roles.where(group_id: params[:group_id]) if params[:group_id].present?
    roles = roles.where(group: { parent_group_id: params[:parent_group_id] }) if params[:parent_group_id].present?

    readable_roles = UserRole.filter_roles_for_logged_in_user(roles, authenticated_user)
    sorted_roles = UserRole.sort_roles(readable_roles, params[:sort])

    render json: sorted_roles, include: { user: { exclude_deprecated: true }, group: {}, metadata: {} }
  end
end
