# frozen_string_literal: true

class Api::V0::RolesController < Api::V0::ApiController
  before_action :current_user_is_authorized_for_action!, only: [:update, :destroy]
  private def current_user_is_authorized_for_action!
    unless current_user.board_member? || current_user.senior_delegate?
      render json: {}, status: 401
    end
  end

  # Returns a list of roles based on the request parameters.
  def index
    # Initial list will be fetched based on one of userId, groupId, or groupType.
    if params[:userId].present?
      user_id = params.require(:userId)

      # Since most of the roles are yet to be migrated to the new system, we'll fetch this list in a
      # bit of a complicated way.
      user = User.find(user_id)
      roles = []

      if user.delegate_status.present?
        roles << user.delegate_role
      end

      roles.concat(user.team_roles)

      if user.admin? || user.board_member?
        roles << {
          group: {
            id: 'admin',
            name: 'Admin Group',
            group_type: UserGroup.group_types[:teams],
            is_hidden: false,
            is_active: true,
          },
          user: user,
          metadata: {
            status: 'member',
          },
        }
      end

    elsif params[:groupId].present?
      group_id = params.require(:groupId)
      roles = Role.where(group_id: group_id)

    elsif params[:groupType].present?
      group_type = params.require(:groupType)
      if group_type == UserGroup.group_types[:delegate_regions]
        roles = []
        # Temporary hack to support the old delegate structure, will be removed once all roles are
        # migrated to the new system.
        User.where.not(delegate_status: nil).find_each do |delegate|
          roles << delegate.delegate_role
        end
      else
        group_ids = UserGroup.where(group_type: group_type).pluck(:id)
        roles = Role.where(group_id: group_ids)
      end

    else
      raise "Must provide userId, groupId, or groupType"
    end

    # Filter the list based on the permissions of the current user.
    roles = roles.select do |role|
      is_actual_role = role.is_a?(Role) # Eventually, all roles will be migrated to the new system,
      # till then some roles will actually be hashes.
      group = is_actual_role ? role.group : role[:group] # In future this will be group = role.group
      # hence, to reduce the number of lines to be edited in future, will be using ternary operator
      # to access the parameters of group.
      if is_actual_role ? group.is_hidden : group[:is_hidden]
        if group.group_type == UserGroup.group_types[:delegate_probation]
          current_user.can_manage_delegate_probation?
        else
          false # Don't accept any other hidden groups.
        end
      else
        true # Accept all non-hidden groups.
      end
    end

    # Filter the list based on the other parameters.
    if params[:isActive].present?
      is_active = ActiveRecord::Type::Boolean.new.cast(params.require(:isActive))
      roles = roles.select { |role| role.is_active == is_active }
    end

    if params[:status].present?
      status = params.require(:status)
      roles = roles.select do |role|
        is_actual_role = role.is_a?(Role) # See previous is_actual_role comment.
        status = is_actual_role ? role.metadata.status : role[:metadata][:status]
        status == params[:status]
      end
    end

    render json: roles
  end

  def show
    user_id = params.require(:userId)
    is_active_role = ActiveRecord::Type::Boolean.new.cast(params.require(:isActiveRole))

    if is_active_role
      user = User.find(user_id)
      render json: {
        roleData: {
          delegateStatus: user.delegate_status,
          regionId: user.region_id,
          location: user.location,
        },
        regions: UserGroup.regions,
      }
    else
      render json: {
        roleData: {},
        regions: UserGroup.regions,
      }
    end
  end

  def update
    user_id = params.require(:userId)
    delegate_status = params.require(:delegateStatus)
    region_id = params.require(:regionId)
    location = params.require(:location)

    user = User.find(user_id)
    if delegate_status == "senior_delegate"
      senior_delegate_id = nil
      User.where(region_id: region_id).where.not(id: user_id).update_all(senior_delegate_id: user_id)
    else
      senior_delegate_id = User.where(delegate_status: "senior_delegate", region_id: region_id).first.id
    end
    user.update!(delegate_status: delegate_status, senior_delegate_id: senior_delegate_id, region_id: region_id, location: location)
    send_role_change_notification(user)

    render json: {
      success: true,
    }
  end

  def destroy
    user_id = params.require(:userId)

    user = User.find(user_id)
    user.update!(delegate_status: '', senior_delegate_id: '', region_id: '', location: '')
    send_role_change_notification(user)

    render json: {
      success: true,
    }
  end

  private def send_role_change_notification(user)
    if user.saved_change_to_delegate_status
      if user.delegate_status
        user_senior_delegate = user.senior_or_self
      else
        user_senior_delegate = User.find(user.senior_delegate_id_before_last_save)
      end
      DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(
        user,
        current_user,
        user_senior_delegate,
        user.delegate_status_before_last_save,
        user.delegate_status,
      ).deliver_later
    end
  end
end
