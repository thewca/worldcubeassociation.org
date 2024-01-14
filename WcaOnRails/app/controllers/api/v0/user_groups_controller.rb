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
      is_actual_group = group.is_a?(UserGroup) # Eventually, all groups will be migrated to the new system,
      # till then some groups will actually be hashes.
      if is_actual_group && group.is_hidden
        if group.group_type == UserGroup.group_types[:delegate_probation]
          current_user.can_manage_delegate_probation?
        else
          false # Don't accept any other hidden groups.
        end
      else
        true # Accept all non-hidden groups and old-system groups.
      end
    end
  end

  def index
    group_type = params.require(:group_type)
    groups = UserGroup.where(group_type: group_type).to_a # to_a is to convert the ActiveRecord::Relation to an
    # array, so that we can append groups which are not yet migrated to the new system. This can be
    # removed once all roles are migrated to the new system.

    # Temporary hack to support old system councils.
    if group_type == "councils"
      Team.all_councils.each do |council|
        groups << {
          id: group_type + "_" + council.id.to_s,
          name: council.name,
          group_type: UserGroup.group_types[:councils],
          is_hidden: false,
          is_active: true,
        }
      end
    end

    # Filters the list of groups based on the permissions of the current user.
    groups = filter_groups_for_logged_in_user(groups)

    # Sorts the list of groups by name.
    groups = groups.sort_by { |group| group[:name] } # Can be changed to `groups.sort_by(&:name)` once all groups are migrated to the new system.`

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
