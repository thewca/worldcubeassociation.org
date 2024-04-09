# frozen_string_literal: true

class RoleChangeMailer < ApplicationMailer
  private def role_metadata(role)
    metadata = {}
    group = UserRole.group(role)

    # Populate the metadata list.
    case group.group_type
    when UserGroup.group_types[:delegate_regions]
      metadata[:region_name] = group.name
      metadata[:status] = I18n.t("enums.user_roles.status.delegate_regions.#{UserRole.status(role)}")
    when UserGroup.group_types[:translators]
      metadata[:locale] = group.metadata.locale
    when UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils], UserGroup.group_types[:officers]
      metadata[:status] = I18n.t("enums.user_roles.status.#{group.group_type}.#{UserRole.status(role)}")
    end
    metadata
  end

  def notify_role_start(role, user_who_made_the_change)
    @role = role
    @user_who_made_the_change = user_who_made_the_change
    @group_type_name = UserGroup.group_type_name[@role.group.group_type.to_sym]
    @metadata = role_metadata(role)

    # Populate the recepient list.
    case role.group.group_type
    when UserGroup.group_types[:delegate_probation]
      to_list = [user_who_made_the_change.email, GroupsMetadataBoard.email, role.user.senior_delegates.map(&:email)].flatten
      reply_to_list = [user_who_made_the_change.email]
    when UserGroup.group_types[:delegate_regions]
      to_list = [user_who_made_the_change.email, GroupsMetadataBoard.email, Team.weat.email, Team.wfc.email]
      reply_to_list = [user_who_made_the_change.email]
    when UserGroup.group_types[:translators]
      to_list = [user_who_made_the_change.email, Team.wst.email]
      reply_to_list = [user_who_made_the_change.email]
    when UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils]
      to_list = [user_who_made_the_change.email, GroupsMetadataBoard.email, Team.weat.email, role.group.lead_user.email]
      reply_to_list = [user_who_made_the_change.email]
    when UserGroup.group_types[:board], UserGroup.group_types[:officers]
      to_list = [user_who_made_the_change.email, GroupsMetadataBoard.email, Team.weat.email]
      reply_to_list = [user_who_made_the_change.email]
    else
      raise "Unknown/Unhandled group type: #{role.group.group_type}"
    end

    # Send email.
    mail(
      to: to_list.compact.uniq,
      reply_to: reply_to_list.compact.uniq,
      subject: "New role added for #{role.user.name} in #{@group_type_name}",
    )
  end

  def notify_role_change(role, user_who_made_the_change, changed_parameter, previous_value, new_value)
    @role = role
    @user_who_made_the_change = user_who_made_the_change
    @changed_parameter = changed_parameter
    @previous_value = previous_value
    @new_value = new_value
    @group_type_name = UserGroup.group_type_name[UserRole.group(role).group_type.to_sym]
    @today_date = Date.today

    # Populate the recepient list.
    case UserRole.group(role).group_type
    when UserGroup.group_types[:delegate_probation]
      to_list = [user_who_made_the_change.email, GroupsMetadataBoard.email, role.user.senior_delegates.map(&:email)].flatten
      reply_to_list = [user_who_made_the_change.email]
    when UserGroup.group_types[:delegate_regions]
      to_list = [user_who_made_the_change.email, GroupsMetadataBoard.email, Team.weat.email, Team.wfc.email]
      reply_to_list = [user_who_made_the_change.email]
    when UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils]
      to_list = [user_who_made_the_change.email, GroupsMetadataBoard.email, Team.weat.email, role.group.lead_user.email]
      reply_to_list = [user_who_made_the_change.email]
    else
      raise "Unknown/Unhandled group type: #{UserRole.group(role).group_type}"
    end

    # Send email.
    mail(
      to: to_list.compact.uniq,
      reply_to: reply_to_list.compact.uniq,
      subject: "Role changed for #{UserRole.user(role).name} in #{@group_type_name}",
    )
  end

  def notify_role_end(role, user_who_made_the_change)
    @role = role
    @user_who_made_the_change = user_who_made_the_change
    @group_type_name = UserGroup.group_type_name[UserRole.group(role).group_type.to_sym]
    @metadata = role_metadata(role)

    # Populate the recepient list.
    case UserRole.group(role).group_type
    when UserGroup.group_types[:delegate_regions]
      to_list = [user_who_made_the_change.email, GroupsMetadataBoard.email, Team.weat.email, Team.wfc.email]
      reply_to_list = [user_who_made_the_change.email]
    when UserGroup.group_types[:translators]
      to_list = [user_who_made_the_change.email, Team.wst.email]
      reply_to_list = [user_who_made_the_change.email]
    when UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils]
      to_list = [user_who_made_the_change.email, GroupsMetadataBoard.email, Team.weat.email, role.group.lead_user.email]
      reply_to_list = [user_who_made_the_change.email]
    when UserGroup.group_types[:board], UserGroup.group_types[:officers]
      to_list = [user_who_made_the_change.email, GroupsMetadataBoard.email, Team.weat.email]
      reply_to_list = [user_who_made_the_change.email]
    else
      raise "Unknown/Unhandled group type: #{role.group.group_type}"
    end

    # Send email.
    mail(
      to: to_list.compact.uniq,
      reply_to: reply_to_list.compact.uniq,
      subject: "Role removed for #{UserRole.user(role).name} in #{@group_type_name}",
    )
  end
end
