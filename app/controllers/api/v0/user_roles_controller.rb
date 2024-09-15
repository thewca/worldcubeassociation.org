# frozen_string_literal: true

class Api::V0::UserRolesController < Api::V0::ApiController
  # Removes all pending WCA ID claims for the demoted Delegate and notifies the users.
  private def remove_pending_wca_id_claims(role)
    region_senior_delegate = role.group.senior_delegate
    role.user.confirmed_users_claiming_wca_id.each do |confirmed_user|
      WcaIdClaimMailer.notify_user_of_delegate_demotion(confirmed_user, role.user, region_senior_delegate).deliver_later
    end
    # Clear all pending WCA IDs claims for the demoted Delegate
    User.where(delegate_to_handle_wca_id_claim: role.user.id).update_all(delegate_id_to_handle_wca_id_claim: nil, unconfirmed_wca_id: nil)
  end

  private def pre_filtered_user_roles
    active_record = UserRole.includes(:user, :group) # Including user & group for post filtering.
    is_active = params.key?(:isActive) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isActive)) : nil
    is_group_hidden = params.key?(:isGroupHidden) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isGroupHidden)) : nil
    group_type = params[:groupType]
    group_id = params[:groupId]
    user_id = params[:userId]

    # In next few lines, instead of foo.present? we are using !foo.nil? because foo.present? returns
    # false if foo is a boolean false but we need to actually check if the boolean is present or not.
    if !is_active.nil?
      active_record = is_active ? active_record.active : active_record.inactive
    end
    if !is_group_hidden.nil?
      active_record = active_record.where(group: { is_hidden: is_group_hidden })
    end
    if group_type.present?
      active_record = active_record.where(group: { group_type: group_type })
    end
    if group_id.present?
      active_record = active_record.where(group_id: group_id)
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

    # Paginating the list by sending only first 100 elements unless mentioned in the API.
    paginate json: roles
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
      ban_reason = params[:banReason]
      scope = params[:scope]
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
        metadata = RolesMetadataBannedCompetitors.create!(ban_reason: ban_reason, scope: scope)
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
    when 'ban_reason'
      'Ban reason'
    when 'scope'
      'Ban scope'
    else
      nil
    end
  end

  private def changed_value_to_human_readable(changed_value)
    changed_value.nil? ? 'None' : changed_value
  end

  private def changes_in_model(previous_changes)
    previous_changes&.map do |changed_key, values|
      changed_parameter = changed_key_to_human_readable(changed_key)
      if changed_parameter.present?
        UserRole::UserRoleChange.new(
          changed_parameter: changed_parameter,
          previous_value: changed_value_to_human_readable(values[0]),
          new_value: changed_value_to_human_readable(values[1]),
        )
      end
    end
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
          metadata = RolesMetadataDelegateRegions.create!(
            status: status,
            location: role.metadata.location,
            first_delegated: role.metadata.first_delegated,
            last_delegated: role.metadata.last_delegated,
            total_delegated: role.metadata.total_delegated,
          )
          role = UserRole.create!(
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
          metadata = RolesMetadataDelegateRegions.create!(
            status: role.metadata.status,
            location: role.metadata.location,
            first_delegated: role.metadata.first_delegated,
            last_delegated: role.metadata.last_delegated,
            total_delegated: role.metadata.total_delegated,
          )
          role = UserRole.create!(
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
          metadata = RolesMetadataDelegateRegions.create!(
            status: role.metadata.status,
            location: location,
            first_delegated: role.metadata.first_delegated,
            last_delegated: role.metadata.last_delegated,
            total_delegated: role.metadata.total_delegated,
          )
          role = UserRole.create!(
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
          role = UserRole.create!(
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
        role.end_date = params[:endDate]
      end

      if params.key?(:banReason)
        role.metadata.ban_reason = params[:banReason]
      end

      if params.key?(:scope)
        role.metadata.scope = params.require(:scope)
      end

      ActiveRecord::Base.transaction do
        role.metadata&.save!
        role.save!
      end
      changes.concat(changes_in_model(role.metadata&.previous_changes).compact)
      changes.concat(changes_in_model(role.previous_changes).compact)
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
      remove_pending_wca_id_claims(role)
    end
    render json: {
      success: true,
    }
  end

  def search
    query = params.require(:query)
    group_type = params.require(:groupType)
    roles = UserGroup.roles_of_group_type(group_type)
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
