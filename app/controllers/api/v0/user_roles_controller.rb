# frozen_string_literal: true

class Api::V0::UserRolesController < Api::V0::ApiController
  # Removes all pending WCA ID claims for the demoted Delegate and notifies the users.
  private def remove_pending_wca_id_claims(user)
    region_senior_delegate = user.region.senior_delegate
    user.confirmed_users_claiming_wca_id.each do |confirmed_user|
      WcaIdClaimMailer.notify_user_of_delegate_demotion(confirmed_user, user, region_senior_delegate).deliver_later
    end
    # Clear all pending WCA IDs claims for the demoted Delegate
    User.where(delegate_to_handle_wca_id_claim: user.id).update_all(delegate_id_to_handle_wca_id_claim: nil, unconfirmed_wca_id: nil)
  end

  private def pre_filtered_user_roles
    active_record = UserRole
    is_active = params.key?(:isActive) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isActive)) : nil
    group_type = params[:groupType]
    user_id = params[:userId]

    # In next few lines, instead of foo.present? we are using !foo.nil? because foo.present? returns
    # false if foo is a boolean false but we need to actually check if the boolean is present or not.
    if !is_active.nil?
      active_record = is_active ? active_record.active : active_record.inactive
    end
    if group_type.present?
      active_record = active_record.includes(:group).where(group: { group_type: group_type })
    end
    if user_id.present?
      active_record = active_record.where(user_id: user_id)
    end
    active_record
  end

  # Returns a list of roles based on the parameters.
  def index
    roles = pre_filtered_user_roles

    # Filter & Sort roles.
    roles = UserRole.filter_roles(roles, current_user, params)
    roles = UserRole.sort_roles(roles, params[:sort])

    # Limiting to first 100 elements of roles array to avoid serializing of large array.
    render json: roles.first(100)
  end

  # Returns a list of roles primarily based on userId.
  def index_for_user
    user_id = params.require(:user_id)
    user = User.find(user_id)
    roles = user.roles

    # Filter & Sort roles
    roles = UserRole.filter_roles(roles, current_user, params)
    roles = UserRole.sort_roles(roles, params[:sort])

    render json: roles
  end

  # Returns a list of roles primarily based on groupId.
  def index_for_group
    group_id = params.require(:group_id)
    group = UserGroup.find(group_id)
    roles = group.roles

    # Filter & Sort roles
    roles = UserRole.filter_roles(roles, current_user, params)
    roles = UserRole.sort_roles(roles, params[:sort])

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

    # Filter & Sort roles
    roles = UserRole.filter_roles(roles, current_user, params)
    roles = UserRole.sort_roles(roles, params[:sort])

    render json: roles
  end

  def show
    id = params.require(:id)
    role = UserRole.find(id)
    return render status: :unauthorized, json: { error: "Cannot access role" } unless role.can_user_read?(current_user)
    render json: role
  end

  def create
    user_id = params.require(:userId)
    group_id = params[:groupId] || UserGroup.find_by(group_type: params.require(:groupType)).id
    end_date = params[:endDate]

    create_supported_groups = [
      UserGroup.group_types[:delegate_regions],
      UserGroup.group_types[:delegate_probation],
      UserGroup.group_types[:translators],
      UserGroup.group_types[:officers],
      UserGroup.group_types[:teams_committees],
      UserGroup.group_types[:councils],
      UserGroup.group_types[:board],
      UserGroup.group_types[:banned_competitors],
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

    if group.banned_competitors?
      user = User.find(user_id)
      upcoming_comps_for_user = user.competitions_registered_for.not_over.merge(Registration.not_deleted).pluck(:id)
      unless upcoming_comps_for_user.empty?
        return render status: :unprocessable_entity, json: {
          error: "The user has upcoming competitions: #{upcoming_comps_for_user.join(', ')}. Before banning the user, make sure their registrations are deleted.",
        }
      end
    end

    return render status: :unprocessable_entity, json: { error: "Invalid group type" } unless create_supported_groups.include?(group.group_type)
    return head :unauthorized unless current_user.has_permission?(:can_edit_groups, group_id.to_i)

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
      elsif group.group_type == UserGroup.group_types[:banned_competitors]
        metadata = RolesMetadataBannedCompetitors.create!
      else
        metadata = nil
      end

      new_role = UserRole.create!(
        user_id: user_id,
        group_id: group_id,
        start_date: Date.today,
        end_date: end_date,
        metadata: metadata,
      )
    end

    RoleChangeMailer.notify_role_end(role_to_end, current_user).deliver_later if role_to_end.present?
    RoleChangeMailer.notify_role_start(new_role, current_user).deliver_later
    render json: {
      success: true,
    }
  end

  private def changed_key_to_human_readable(changed_key)
    case changed_key
    when 'end_date'
      'End Date'
    else
      nil
    end
  end

  private def changed_value_to_human_readable(changed_value)
    changed_value.nil? ? 'None' : changed_value
  end

  # update method is written in a way that at a time, only one parameter can be changed. If multiple
  # values needs to be changed, then they need to be sent as separate APIs from the client.
  def update
    id = params.require(:id)

    role = UserRole.find(id)
    group_type = role.group.group_type
    changes = []

    return head :unauthorized unless current_user.has_permission?(:can_edit_groups, role.group.id)

    if group_type == UserGroup.group_types[:delegate_regions]
      if params.key?(:status)
        status = params.require(:status)
        changes << UserRole::UserRoleChange.new(
          changed_parameter: 'Status',
          previous_value: I18n.t("enums.user_roles.status.delegate_regions.#{role.metadata.status}", locale: 'en'),
          new_value: I18n.t("enums.user_roles.status.delegate_regions.#{status}", locale: 'en'),
        )

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
        changes << UserRole::UserRoleChange.new(
          changed_parameter: 'Delegate Region',
          previous_value: UserGroup.find(role.group.id).name,
          new_value: UserGroup.find(group_id).name,
        )

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
        changes << UserRole::UserRoleChange.new(
          changed_parameter: 'Location',
          previous_value: role.metadata.location,
          new_value: location,
        )

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
        changes << UserRole::UserRoleChange.new(
          changed_parameter: 'End Date',
          previous_value: role.end_date || 'Empty',
          new_value: end_date,
        )

        role.update!(end_date: Date.safe_parse(end_date))
      else
        return render status: :unprocessable_entity, json: { error: "Invalid parameter to be changed" }
      end
    elsif [UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils]].include?(group_type)
      if params.key?(:status)
        status = params.require(:status)
        changes << UserRole::UserRoleChange.new(
          changed_parameter: 'Status',
          previous_value: I18n.t("enums.user_roles.status.#{group_type}.#{role.metadata.status}", locale: 'en'),
          new_value: I18n.t("enums.user_roles.status.#{group_type}.#{status}", locale: 'en'),
        )

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
    elsif group_type == UserGroup.group_types[:banned_competitors]
      if params.key?(:endDate)
        role.end_date = params.require(:endDate)
      end

      role.save!
      role.previous_changes.each do |changed_key, values|
        changed_parameter = changed_key_to_human_readable(changed_key)
        if changed_parameter.present?
          changes << UserRole::UserRoleChange.new(
            changed_parameter: changed_parameter,
            previous_value: changed_value_to_human_readable(values[0]),
            new_value: changed_value_to_human_readable(values[1]),
          )
        end
      end
    else
      return render status: :unprocessable_entity, json: { error: "Invalid group type" }
    end
    RoleChangeMailer.notify_role_change(role, current_user, changes.to_json).deliver_later
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
