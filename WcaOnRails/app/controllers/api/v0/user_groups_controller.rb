# frozen_string_literal: true

class Api::V0::UserGroupsController < Api::V0::ApiController
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

  # Filters the list of groups based on given parameters.
  private def filter_groups_for_parameters(groups: [], is_active: nil)
    groups.reject do |group|
      (
        !is_active.nil? && is_active != group.is_active
      )
    end
  end

  def index
    group_type = params.require(:groupType)
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

    # Filter the list based on the other parameters.
    groups = filter_groups_for_parameters(
      groups: groups,
      is_active: params.key?(:isActive) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isActive)) : nil,
    )

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
    friendly_id = params[:friendlyId]

    unless current_user.has_permission?(:can_create_groups, group_type)
      render json: {}, status: 401
      return
    end

    ActiveRecord::Base.transaction do
      if group_type == UserGroup.group_types[:delegate_regions]
        metadata = GroupsMetadataDelegateRegions.create!(friendly_id: friendly_id)
      end
      UserGroup.create!(group_type: group_type, name: name, parent_group_id: parent_group_id, is_active: is_active, is_hidden: is_hidden, metadata: metadata)
    end
    render json: {
      success: true,
    }
  end

  def update
    user_group_params = params.require(:user_group).permit(:name, :is_active, :is_hidden)
    user_group_id = params.require(:id)
    user_group = UserGroup.find(user_group_id)

    unless current_user.has_permission?(:can_edit_groups, user_group_id)
      render json: {}, status: 401
      return
    end

    user_group.update!(user_group_params)

    render json: {
      success: true,
    }
  end
end
