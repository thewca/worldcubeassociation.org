# frozen_string_literal: true

class Api::V0::UserGroupsController < Api::V0::ApiController
  before_action :current_user_is_authorized_for_action!, only: [:update]
  private def current_user_is_authorized_for_action!
    unless current_user.can_access_board_panel?
      render json: {}, status: 401
    end
  end

  # Filters the list of groups based on the permissions of the current user.
  private def filter_groups_for_logged_in_user(groups)
    groups.select do |group|
      if group.is_hidden
        if group.group_type == UserGroup.group_types[:delegate_probation]
          current_user.can_manage_delegate_probation?
        else
          false # Don't accept any other hidden groups.
        end
      else
        true # Accept all non-hidden groups.
      end
    end
  end

  def index
    group_type = params.require(:group_type)
    groups = UserGroup.where(group_type: group_type)

    # Filters the list of groups based on the permissions of the current user.
    groups = filter_groups_for_logged_in_user(groups)

    render json: groups
  end

  def create
    group_type = params.require(:group_type)
    name = params.require(:name)
    parent_group_id = params[:parent_group_id]
    is_active = ActiveRecord::Type::Boolean.new.cast(params.require(:is_active))
    is_hidden = ActiveRecord::Type::Boolean.new.cast(params.require(:is_hidden))

    UserGroup.create!(group_type: group_type, name: name, parent_group_id: parent_group_id, is_active: is_active, is_hidden: is_hidden)
    render json: {
      success: true,
    }
  end

  def update
    user_group_params = params.require(:user_group).permit(:name, :is_active, :is_hidden)
    user_group_id = params.require(:id)
    user_group = UserGroup.find(user_group_id)
    user_group.update!(user_group_params)

    render json: {
      success: true,
    }
  end
end
