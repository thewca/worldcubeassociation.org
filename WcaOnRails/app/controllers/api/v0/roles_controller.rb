# frozen_string_literal: true

class Api::V0::RolesController < Api::V0::ApiController
  before_action :current_user_is_authorized_for_action!, only: [:update, :destroy]
  private def current_user_is_authorized_for_action!
    unless current_user.board_member? || current_user.senior_delegate?
      render json: {}, status: 401
    end
  end

  # Filters the list of roles based on the permissions of the current user.
  private def filter_roles_for_logged_in_user(roles)
    roles.select do |role|
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
  end

  # Filters the list of roles based on given parameters.
  private def filter_roles_for_parameters(roles, status)
    unless status.nil?
      roles = roles.select do |role|
        is_actual_role = role.is_a?(Role) # See previous is_actual_role comment.
        if is_actual_role
          role.metadata.status == status
        else
          role[:metadata][:status] == status
        end
      end
    end

    roles
  end

  # Returns a list of roles by user which are not yet migrated to the new system.
  private def user_roles_not_yet_in_new_system(user_id)
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

    roles
  end

  # Returns a list of roles by user which are not yet migrated to the new system.
  private def group_roles_not_yet_in_new_system(group_id)
    group = UserGroup.find(group_id)
    roles = []

    if group.group_type == UserGroup.group_types[:delegate_regions]
      User.where(region_id: group.id).map do |delegate_user|
        roles << delegate_user.delegate_role
      end
    end

    roles
  end

  # Removes all pending WCA ID claims for the demoted Delegate and notifies the users.
  private def remove_pending_wca_id_claims(user)
    region_senior_delegate = user.region.senior_delegate
    user.confirmed_users_claiming_wca_id.each do |confirmed_user|
      WcaIdClaimMailer.notify_user_of_delegate_demotion(confirmed_user, user, region_senior_delegate).deliver_later
    end
    # Clear all pending WCA IDs claims for the demoted Delegate
    User.where(delegate_to_handle_wca_id_claim: user.id).update_all(delegate_id_to_handle_wca_id_claim: nil, unconfirmed_wca_id: nil)
  end

  # Returns a list of roles primarily based on userId.
  def index_for_user
    user_id = params.require(:user_id)
    roles = Role.where(user_id: user_id).to_a # to_a is to convert the ActiveRecord::Relation to an
    # array, so that we can append roles which are not yet migrated to the new system. This can be
    # removed once all roles are migrated to the new system.

    # Appends roles which are not yet migrated to the new system.
    roles.concat(user_roles_not_yet_in_new_system(user_id))

    # Filter the list based on the permissions of the logged in user.
    roles = filter_roles_for_logged_in_user(roles)

    render json: roles
  end

  # Returns a list of roles primarily based on groupId.
  def index_for_group
    group_id = params.require(:group_id)
    roles = Role.where(group_id: group_id).to_a # to_a is for the same reason as in index_for_user.

    # Appends roles which are not yet migrated to the new system.
    roles.concat(group_roles_not_yet_in_new_system(group_id))

    # Filter the list based on the permissions of the logged in user.
    roles = filter_roles_for_logged_in_user(roles)

    render json: roles
  end

  # Returns a list of roles primarily based on groupType.
  def index_for_group_type
    group_type = params.require(:group_type)
    group_ids = UserGroup.where(group_type: group_type).pluck(:id)
    roles = Role.where(group_id: group_ids).to_a # to_a is for the same reason as in index_for_user.

    # Temporary hack to support the old delegate structure, will be removed once all roles are
    # migrated to the new system.
    if group_type == UserGroup.group_types[:delegate_regions]
      roles.concat(User.where.not(delegate_status: nil).map(&:delegate_role))
    end

    # Filter the list based on the permissions of the logged in user.
    roles = filter_roles_for_logged_in_user(roles)

    # Filter the list based on the other parameters.
    roles = filter_roles_for_parameters(roles, params[:status])

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
        regions: UserGroup.delegate_regions,
      }
    else
      render json: {
        roleData: {},
        regions: UserGroup.delegate_regions,
      }
    end
  end

  def update
    user_id = params.require(:userId)
    delegate_status = params.require(:delegateStatus)
    region_id = params.require(:regionId)
    location = params.require(:location)

    user = User.find(user_id)
    user.update!(delegate_status: delegate_status, region_id: region_id, location: location)
    send_role_change_notification(user)

    render json: {
      success: true,
    }
  end

  def destroy
    user_id = params.require(:userId)

    user = User.find(user_id)
    remove_pending_wca_id_claims(user)
    user.update!(delegate_status: '', region_id: '', location: '')
    send_role_change_notification(user)

    render json: {
      success: true,
    }
  end

  private def send_role_change_notification(user)
    if user.saved_change_to_delegate_status
      if user.delegate_status
        region_id = user.region_id
      else
        region_id = user.region_id_before_last_save
      end
      region_senior_delegate = UserGroup.find_by(id: region_id).senior_delegate
      DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(
        user,
        current_user,
        region_senior_delegate,
        user.delegate_status_before_last_save,
        user.delegate_status,
      ).deliver_later
    end
  end
end
