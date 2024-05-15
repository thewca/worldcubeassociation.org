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
      lambda { |role| role.start_date.to_time.to_i },
    lead:
      lambda { |role| role.is_lead? ? 0 : 1 },
    eligibleVoter:
      lambda { |role| role.is_eligible_voter? ? 0 : 1 },
    groupTypeRank:
      lambda { |role| GROUP_TYPE_RANK_ORDER.find_index(role.group_type) || GROUP_TYPE_RANK_ORDER.length },
    status:
      lambda { |role| role.status_sort_rank },
    name:
      lambda { |role| role.user.name },
    groupName:
      lambda { |role| role.group.name },
    location:
      lambda { |role| role.metadata.location || '' },
  }.freeze

  # Sorts the list of roles based on the given list of sort keys and directions.
  private def sorted_roles(roles, sort_param)
    sort_param ||= ''
    sort(roles, sort_param, SORT_WEIGHT_LAMBDAS)
  end

  # Filter role based on the permissions of the current user.
  private def can_current_user_access(role)
    group = role.group
    !group.is_hidden || current_user&.has_permission?(:can_edit_groups, group.id)
  end

  # Filters the list of roles based on the permissions of the current user.
  private def filter_roles_for_logged_in_user(roles)
    roles.select do |role|
      can_current_user_access(role)
    end
  end

  # Filters the list of roles based on given parameters.
  private def filter_roles_for_parameters(roles: [], status: nil, is_active: nil, is_group_hidden: nil, group_type: nil, is_lead: nil)
    roles.reject do |role|
      # Here, instead of foo.present? we are using !foo.nil? because foo.present? returns false if
      # foo is a boolean false but we need to actually check if the boolean is present or not.
      (
        (!status.nil? && status != role.metadata&.status) ||
        (!is_active.nil? && is_active != role.is_active?) ||
        (!is_group_hidden.nil? && is_group_hidden != role.group.is_hidden) ||
        (!group_type.nil? && group_type != role.group_type) ||
        (!is_lead.nil? && is_lead != role.is_lead?)
      )
    end
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
    UserRole.where(group_id: group_ids)
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

  def show
    id = params.require(:id)
    role = UserRole.find(id)
    return render status: :unauthorized, json: { error: "Cannot access role" } unless can_current_user_access(role)
    render json: role
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

    return render status: :unprocessable_entity, json: { error: "Invalid group type" } unless create_supported_groups.include?(group.group_type)
    return head :unauthorized unless current_user.has_permission?(:can_edit_groups, group_id)

    role_to_end = nil
    new_role = nil

    ActiveRecord::Base.transaction do
      if status.present? && group.unique_status?(status)
        role_to_end = group.lead_role
        if role_to_end.present?
          role_to_end.update!(end_date: Date.today)
        end
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

      new_role = UserRole.create!(
        user_id: user_id,
        group_id: group_id,
        start_date: Date.today,
        metadata: metadata,
      )
    end

    RoleChangeMailer.notify_role_end(role_to_end, current_user).deliver_later if role_to_end.present?
    RoleChangeMailer.notify_role_start(new_role, current_user).deliver_later
    render json: {
      success: true,
    }
  end

  # update method is written in a way that at a time, only one parameter can be changed. If multiple
  # values needs to be changed, then they need to be sent as separate APIs from the client.
  def update
    id = params.require(:id)

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
    elsif [UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils]].include?(group_type)
      if params.key?(:status)
        status = params.require(:status)
        changed_parameter = 'Status'
        previous_value = I18n.t("enums.user_roles.status.#{group_type}.#{role.metadata.status}", locale: 'en')
        new_value = I18n.t("enums.user_roles.status.#{group_type}.#{status}", locale: 'en')

        ActiveRecord::Base.transaction do
          role.update!(end_date: Date.today)
          if group_type == UserGroup.group_types[:teams_committees]
            metadata = RolesMetadataTeamsCommittees.create!(status: status)
          elsif group_type == UserGroup.group_types[:councils]
            metadata = RolesMetadataCouncils.create!(status: status)
          end
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
    else
      return render status: :unprocessable_entity, json: { error: "Invalid group type" }
    end
    RoleChangeMailer.notify_role_change(role, current_user, changed_parameter, previous_value, new_value).deliver_later
    render json: { success: true }
  end

  def destroy
    id = params.require(:id)

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
    active_roles = roles.select { |role| role.is_active? }

    query.split.each do |part|
      active_roles = active_roles.select do |role|
        user = role.user
        name = user[:name] || ''
        wca_id = user[:wca_id] || ''
        email = user[:email] || ''
        name.downcase.include?(part.downcase) || wca_id.downcase.include?(part.downcase) || email.downcase.include?(part.downcase)
      end
    end

    render json: { result: active_roles }
  end
end
