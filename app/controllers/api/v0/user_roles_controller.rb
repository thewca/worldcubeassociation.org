# frozen_string_literal: true

class Api::V0::UserRolesController < Api::V0::ApiController
  include SortHelper

  GROUP_TYPE_RANK_ORDER = [
    UserGroup.group_types[:board],
    UserGroup.group_types[:officers],
    UserGroup.group_types[:teams_committees],
    UserGroup.group_types[:delegate_regions],
    UserGroup.group_types[:councils],
  ].freeze

  SORT_WEIGHT_LAMBDAS = {
    startDate:
      lambda { |role| role[:start_date].to_time.to_i },
    lead:
      lambda { |role| UserRole.is_lead?(role) ? 0 : 1 },
    eligibleVoter:
      lambda { |role| UserRole.is_eligible_voter?(role) ? 0 : 1 },
    groupTypeRank:
      lambda { |role| GROUP_TYPE_RANK_ORDER.find_index(UserRole.group_type(role)) || GROUP_TYPE_RANK_ORDER.length },
    status:
      lambda { |role| UserRole.status_sort_rank(role) },
    name:
      lambda { |role| role.is_a?(UserRole) ? role.user[:name] : role[:user][:name] }, # Can be changed to `role.user.name` once all roles are migrated to the new system.
    groupName:
      lambda { |role| role.is_a?(UserRole) ? role.group[:name] : role[:group][:name] }, # Can be changed to `role.group.name` once all roles are migrated to the new system.
    location:
      lambda { |role| role.is_a?(UserRole) ? role.metadata[:location] || '' : role[:metadata][:location] || '' }, # Can be changed to `role.location` once all roles are migrated to the new system.
  }.freeze

  # Sorts the list of roles based on the given list of sort keys and directions.
  private def sorted_roles(roles, sort_param)
    sort_param ||= ''
    sort(roles, sort_param, SORT_WEIGHT_LAMBDAS)
  end

  # Filters the list of roles based on the permissions of the current user.
  private def filter_roles_for_logged_in_user(roles)
    roles.select do |role|
      group = UserRole.group(role)
      !group.is_hidden || current_user&.has_permission?(:can_edit_groups, group.id)
    end
  end

  # Filters the list of roles based on given parameters.
  private def filter_roles_for_parameters(roles: [], status: nil, is_active: nil, is_group_hidden: nil, group_type: nil, is_lead: nil)
    roles.reject do |role|
      is_actual_role = role.is_a?(UserRole) # See previous is_actual_role comment.
      # In future, the following lines will be replaced by the following:
      # (
      #   status.present? && status != role.metadata.status ||
      #   is_active.present? && is_active != role.is_active ||
      #   is_group_hidden.present? && is_group_hidden != role.group.is_hidden
      # )
      # Till then, we need to support both the old and new systems. So, we will be using ternary
      # operator to access the parameters.
      # Here, instead of foo.present? we are using !foo.nil? because foo.present? returns false if
      # foo is a boolean false but we need to actually check if the boolean is present or not.
      (
        (!status.nil? && status != (is_actual_role ? role.metadata.status : role[:metadata][:status])) ||
        (!is_active.nil? && is_active != (is_actual_role ? role.is_active? : role[:is_active])) ||
        (!is_group_hidden.nil? && is_group_hidden != (is_actual_role ? role.group.is_hidden : role[:group][:is_hidden])) ||
        (!group_type.nil? && group_type != UserRole.group_type(role)) ||
        (!is_lead.nil? && is_lead != UserRole.is_lead?(role))
      )
    end
  end

  private def group_id_of_old_system_to_group_type(group_id)
    # group_id can be something like "teams_committees_1" or "delegate_regions_1", where 1 is the
    # id of the group. This method will return "teams_committees" or "delegate_regions" respectively.
    group_id.split("_").reverse.drop(1).reverse.join("_")
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
    user = User.find(user_id)
    roles = user.roles

    # Filter the list based on the permissions of the logged in user.
    roles = filter_roles_for_logged_in_user(roles)

    # Filter the list based on the other parameters.
    roles = filter_roles_for_parameters(
      roles: roles,
      is_active: params.key?(:isActive) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isActive)) : nil,
      is_group_hidden: params.key?(:isGroupHidden) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isGroupHidden)) : nil,
      status: params[:status],
      group_type: params[:groupType],
    )

    # Sort the roles.
    roles = sorted_roles(roles, params[:sort])

    render json: roles
  end

  # Returns a list of roles primarily based on groupId.
  def index_for_group
    group_id = params.require(:group_id)
    group = UserGroup.find(group_id)
    roles = group.roles

    # Filter the list based on the permissions of the logged in user.
    roles = filter_roles_for_logged_in_user(roles)

    # Filter the list based on the other parameters.
    status = params[:status]
    is_active = params.key?(:isActive) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isActive)) : nil
    is_group_hidden = params.key?(:isGroupHidden) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isGroupHidden)) : nil
    is_lead = params.key?(:isLead) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isLead)) : nil
    roles = filter_roles_for_parameters(
      roles: roles,
      status: status,
      is_active: is_active,
      is_group_hidden: is_group_hidden,
      is_lead: is_lead,
    )

    # Sort the roles.
    roles = sorted_roles(roles, params[:sort])

    render json: roles
  end

  private def roles_of_group_type(group_type)
    group_ids = UserGroup.where(group_type: group_type).pluck(:id)
    roles = UserRole.where(group_id: group_ids).to_a # to_a is for the same reason as in index_for_user.

    # Temporary hack to support the old system roles, will be removed once all roles are
    # migrated to the new system.
    if group_type == UserGroup.group_types[:teams_committees]
      roles.concat(UserGroup.teams_committees.flat_map(&:roles))
    end

    roles
  end

  # Returns a list of roles primarily based on groupType.
  def index_for_group_type
    group_type = params.require(:group_type)
    roles = roles_of_group_type(group_type)

    # Filter the list based on the permissions of the logged in user.
    roles = filter_roles_for_logged_in_user(roles)

    # Filter the list based on the other parameters.
    status = params[:status]
    is_active = params.key?(:isActive) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isActive)) : nil
    is_lead = params.key?(:isLead) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isLead)) : nil
    roles = filter_roles_for_parameters(
      roles: roles,
      status: status,
      is_active: is_active,
      is_lead: is_lead,
    )

    # Sort the roles.
    roles = sorted_roles(roles, params[:sort])

    render json: roles
  end

  private def end_role_for_user_in_group_with_status(group, status)
    if group.group_type == UserGroup.group_types[:delegate_regions]
      role_to_end = group.lead_role
      if role_to_end.present?
        role_to_end.update!(end_date: Date.today)
        RoleChangeMailer.notify_role_end(role_to_end, current_user).deliver_later
      end
    end
  end

  private def create_team_committee_council_role(group, user_id, status)
    team = group.team
    return head :unauthorized unless current_user.has_permission?(:can_edit_groups, group.id)
    if status == "leader"
      # If the new role to be added is leader, we will be ending the leader role of already existing person.
      old_leader = Team.find_by(id: team.id).leader
      if old_leader.present?
        old_leader.update!(end_date: Date.today)
      end
    end
    # If the person who is going to get the new role is already having a role, that role will be ended.
    already_existing_row = TeamMember.find_by(team_id: team.id, user_id: user_id, end_date: nil)
    if already_existing_row.present?
      already_existing_row.update!(end_date: Date.today)
    end
    TeamMember.create!(team_id: team.id, user_id: user_id, start_date: Date.today, team_leader: status == "leader", team_senior_member: status == "senior_member")
    render json: {
      success: true,
    }
  end

  def create
    user_id = params.require(:userId)
    group_id = params[:groupId] || UserGroup.find_by(group_type: params.require(:groupType)).id

    create_supported_groups = [
      UserGroup.group_types[:delegate_regions],
      UserGroup.group_types[:delegate_probation],
      UserGroup.group_types[:translators],
      UserGroup.group_types[:officers],
      UserGroup.group_types[:teams_committees],
      UserGroup.group_types[:councils],
      UserGroup.group_types[:board],
    ]
    group = UserGroup.find(group_id)

    if UserGroup.group_types_containing_status_metadata.include?(group.group_type)
      status = params.require(:status)
    else
      status = nil
    end

    if group.group_type == UserGroup.group_types[:delegate_regions]
      location = params[:location]
    else
      location = nil
    end

    if group.group_type == UserGroup.group_types[:teams_committees] && group.team.present?
      return create_team_committee_council_role(group, user_id, status)
    end

    return render status: :unprocessable_entity, json: { error: "Invalid group type" } unless create_supported_groups.include?(group.group_type)
    return head :unauthorized unless current_user.has_permission?(:can_edit_groups, group_id)

    if status.present? && group.unique_status?(status)
      end_role_for_user_in_group_with_status(group, status)
    end

    if group.group_type == UserGroup.group_types[:delegate_regions]
      metadata = RolesMetadataDelegateRegions.create!(status: status, location: location)
    elsif group.group_type == UserGroup.group_types[:officers]
      metadata = RolesMetadataOfficers.create!(status: status)
    elsif group.group_type == UserGroup.group_types[:teams_committees]
      metadata = RolesMetadataTeamsCommittees.create!(status: status)
    elsif group.group_type == UserGroup.group_types[:councils]
      metadata = RolesMetadataCouncils.create!(status: status)
    else
      metadata = nil
    end

    role = UserRole.create!(
      user_id: user_id,
      group_id: group_id,
      start_date: Date.today,
      metadata: metadata,
    )
    RoleChangeMailer.notify_role_start(role, current_user).deliver_later
    render json: {
      success: true,
    }
  end

  # update method is written in a way that at a time, only one parameter can be changed. If multiple
  # values needs to be changed, then they need to be sent as separate APIs from the client.
  def update
    id = params.require(:id)

    if id.include?("_") # Temporary hack to support some old system roles, will be removed once
      # all roles are migrated to the new system.
      group_type = group_id_of_old_system_to_group_type(id)
      unless [UserGroup.group_types[:councils], UserGroup.group_types[:teams_committees]].include?(group_type)
        render status: :unprocessable_entity, json: { error: "Invalid group type" }
        return
      end
      team_member_id = id.split("_").last
      team_member = TeamMember.find_by!(id: team_member_id)
      team = team_member.team
      status = params.require(:status)

      return head :unauthorized unless current_user.can_edit_team?(team)

      team_member.update!(end_date: Time.now)
      TeamMember.create!(team_id: team.id, user_id: team_member.user_id, start_date: Date.today, team_leader: status == "leader", team_senior_member: status == "senior_member")
      return render json: {
        success: true,
      }
    end

    role = UserRole.find(id)
    group_type = role.group.group_type

    return head :unauthorized unless current_user.has_permission?(:can_edit_groups, role.group.id)

    if group_type == UserGroup.group_types[:delegate_regions]
      if params.key?(:status)
        status = params.require(:status)
        changed_parameter = 'Status'
        previous_value = I18n.t("enums.user_roles.status.delegate_regions.#{role.metadata.status}", locale: 'en')
        new_value = I18n.t("enums.user_roles.status.delegate_regions.#{status}", locale: 'en')

        ActiveRecord::Base.transaction do
          role.update!(end_date: Date.today)
          metadata = RolesMetadataDelegateRegions.create!(status: status, location: role.metadata.location)
          UserRole.create!(
            user_id: role.user.id,
            group_id: role.group.id,
            start_date: Date.today,
            metadata: metadata,
          )
        end
      elsif params.key?(:groupId)
        group_id = params.require(:groupId)
        changed_parameter = 'Delegate Region'
        previous_value = UserGroup.find(role.group.id).name
        new_value = UserGroup.find(group_id).name

        return head :unauthorized unless current_user.has_permission?(:can_edit_groups, group_id)

        ActiveRecord::Base.transaction do
          role.update!(end_date: Date.today)
          metadata = RolesMetadataDelegateRegions.create!(status: role.metadata.status, location: role.metadata.location)
          UserRole.create!(
            user_id: role.user.id,
            group_id: group_id,
            start_date: Date.today,
            metadata: metadata,
          )
        end
      elsif params.key?(:location)
        location = params.require(:location)
        changed_parameter = 'Location'
        previous_value = role.metadata.location
        new_value = location

        ActiveRecord::Base.transaction do
          role.update!(end_date: Date.today)
          metadata = RolesMetadataDelegateRegions.create!(status: role.metadata.status, location: location)
          UserRole.create!(
            user_id: role.user.id,
            group_id: role.group.id,
            start_date: Date.today,
            metadata: metadata,
          )
        end
      else
        return render status: :unprocessable_entity, json: { error: "Invalid parameter to be changed" }
      end
    elsif group_type == UserGroup.group_types[:delegate_probation]
      if params.key?(:endDate)
        end_date = params.require(:endDate)
        changed_parameter = 'End Date'
        previous_value = role.end_date || 'Empty'
        new_value = end_date

        role.update!(end_date: Date.safe_parse(end_date))
      else
        return render status: :unprocessable_entity, json: { error: "Invalid parameter to be changed" }
      end
    else
      return render status: :unprocessable_entity, json: { error: "Invalid group type" }
    end
    RoleChangeMailer.notify_role_change(role, current_user, changed_parameter, previous_value, new_value).deliver_later
    render json: { success: true }
  end

  def destroy
    id = params.require(:id)

    if id.include?("_") # Temporary hack to support some old system roles, will be removed once
      # all roles are migrated to the new system.
      team_member_id = id.split("_").last
      group_type = group_id_of_old_system_to_group_type(id)
      team_member = TeamMember.find_by(id: team_member_id)

      unless [UserGroup.group_types[:councils], UserGroup.group_types[:teams_committees]].include?(group_type)
        render status: :unprocessable_entity, json: { error: "Invalid group type" }
        return
      end
      return head :unauthorized unless current_user.can_edit_team?(team_member.team)

      if team_member.present?
        team_member.update!(end_date: Date.today)
        return render json: {
          success: true,
        }
      else
        return render status: :unprocessable_entity, json: { error: "Invalid member" }
      end
    end

    role = UserRole.find(id)

    return head :unauthorized unless current_user.has_permission?(:can_edit_groups, role.group.id)
    role.update!(end_date: Date.today)
    RoleChangeMailer.notify_role_end(role, current_user).deliver_later
    if role.group.delegate_regions? && !role.user.any_kind_of_delegate?
      remove_pending_wca_id_claims(role.user)
    end
    render json: {
      success: true,
    }
  end

  def search
    query = params.require(:query)
    group_type = params.require(:groupType)
    roles = roles_of_group_type(group_type)
    active_roles = roles.select { |role| UserRole.is_active?(role) }

    query.split.each do |part|
      active_roles = active_roles.select do |role|
        user = UserRole.user(role)
        name = user[:name] || ''
        wca_id = user[:wca_id] || ''
        email = user[:email] || ''
        name.downcase.include?(part.downcase) || wca_id.downcase.include?(part.downcase) || email.downcase.include?(part.downcase)
      end
    end

    render json: { result: active_roles }
  end
end
