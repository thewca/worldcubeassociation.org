# frozen_string_literal: true

class Api::V0::UserGroupsController < Api::V0::ApiController
  # Don't list hidden groups if the user doesn't have edit permission.
  private def filter_groups_for_logged_in_user(groups)
    groups.reject do |group|
      group.is_hidden && !current_user&.has_permission?(:can_edit_groups, group.id)
    end
  end

  # Filters the list of groups based on given parameters.
  private def filter_groups_for_parameters(groups: [], is_active: nil, is_hidden: nil, parent_group_id: nil)
    groups.reject do |group|
      # Here, instead of foo.present? we are using !foo.nil? because foo.present? returns false if
      # foo is a boolean false but we need to actually check if the boolean is present or not.
      (
        (!is_active.nil? && is_active != group.is_active) ||
        (!is_hidden.nil? && is_hidden != group.is_hidden) ||
        (!parent_group_id.nil? && parent_group_id != group.parent_group_id)
      )
    end
  end

  def index
    group_type = params.require(:groupType)
    groups = UserGroup.where(group_type: group_type)

    # Filters the list of groups based on the permissions of the current user.
    groups = filter_groups_for_logged_in_user(groups)

    # Filter the list based on the other parameters.
    groups = filter_groups_for_parameters(
      groups: groups,
      is_active: params.key?(:isActive) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isActive)) : nil,
      is_hidden: params.key?(:isHidden) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isHidden)) : nil,
      parent_group_id: params.key?(:parentGroupId) ? params.require(:parentGroupId).to_i : nil,
    )

    # Sorts the list of groups by name.
    groups = groups.sort_by(&:name)

    render json: groups
  end

  def create
    group_type = params.require(:group_type)
    name = params.require(:name)
    parent_group_id = params[:parent_group_id]
    is_active = ActiveRecord::Type::Boolean.new.cast(params.require(:is_active))
    is_hidden = ActiveRecord::Type::Boolean.new.cast(params.require(:is_hidden))
    friendly_id = params[:friendlyId]

    return head :unauthorized unless current_user&.has_permission?(:can_create_groups, group_type)

    ActiveRecord::Base.transaction do
      if group_type == UserGroup.group_types[:delegate_regions]
        metadata = GroupsMetadataDelegateRegions.create!(friendly_id: friendly_id)
      else
        metadata = nil
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

    return head :unauthorized unless current_user&.has_permission?(:can_edit_groups, user_group_id)

    user_group.update!(user_group_params)

    render json: {
      success: true,
    }
  end
end
