# frozen_string_literal: true

class RoleChangeMailer < ApplicationMailer
  private def wrt_email_recipient
    UserRole::UserRoleEmailRecipient.new(
      name: UserGroup.teams_committees_group_wrt.name,
      email: UserGroup.teams_committees_group_wrt.metadata.email,
      message: 'Please take action if this role change is inconsistent or accidental.',
    )
  end

  private def role_metadata(role)
    metadata = {}
    group = role.group

    # Populate the metadata list.
    case group.group_type
    when UserGroup.group_types[:delegate_regions]
      metadata[:region_name] = group.name
      metadata[:status] = I18n.t("enums.user_roles.status.delegate_regions.#{role.metadata.status}", locale: 'en')
      metadata[:delegated_competitions_count] = role.metadata.total_delegated
    when UserGroup.group_types[:translators]
      metadata[:locale] = group.metadata.locale
    when UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils], UserGroup.group_types[:officers]
      metadata[:status] = I18n.t("enums.user_roles.status.#{group.group_type}.#{role.metadata.status}", locale: 'en')
      metadata[:group_name] = group.name
    end
    metadata.compact
  end

  def notify_role_start(role, user_who_made_the_change)
    @role = role
    @user_who_made_the_change = user_who_made_the_change
    @group_type_name = UserGroup.group_type_name[@role.group.group_type.to_sym]
    @metadata = role_metadata(role)
    @to_list = [wrt_email_recipient]

    # Populate the recepient list.
    case role.group.group_type
    when UserGroup.group_types[:delegate_probation]
      @to_list.push(
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.board_group.name,
          email: GroupsMetadataBoard.email,
          message: 'Informing as a Delegate has been put in probation.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: 'Senior Delegates',
          email: role.user.senior_delegates.map(&:email),
          message: 'Informing as one of the Delegates under you has been put in probation.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_wic.name,
          email: UserGroup.teams_committees_group_wic.metadata.email,
          message: 'Informing as a Delegate has been put in probation.',
        ),
      )
    when UserGroup.group_types[:delegate_regions]
      @to_list.push(
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.board_group.name,
          email: GroupsMetadataBoard.email,
          message: 'Informing as there is a new Delegate appointment.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_weat.name,
          email: UserGroup.teams_committees_group_weat.metadata.email,
          message: 'Please add this to monthly digest and if necessary create a GSuite account.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_wic.name,
          email: UserGroup.teams_committees_group_wic.metadata.email,
          message: 'Informing as there is a new Delegate appointment.',
        ),
      )
    when UserGroup.group_types[:translators]
      @to_list.push(
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_wst.name,
          email: UserGroup.teams_committees_group_wst.metadata.email,
          message: 'Informing as there is a new website translator.',
        ),
      )
    when UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils]
      @to_list.push(
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.board_group.name,
          email: GroupsMetadataBoard.email,
          message: 'Informing as there is a new appointment in a Team/Committee.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_weat.name,
          email: UserGroup.teams_committees_group_weat.metadata.email,
          message: 'Please add this to monthly digest.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: 'Team/Committee Leader',
          email: role.group.lead_user&.email,
          message: 'Informing as there is a new appointment in your Team/Committee.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_wic.name,
          email: UserGroup.teams_committees_group_wic.metadata.email,
          message: 'Informing as there is a new appointment in a Team/Committee.',
        ),
      )
    when UserGroup.group_types[:board], UserGroup.group_types[:officers]
      @to_list.push(
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.board_group.name,
          email: GroupsMetadataBoard.email,
          message: 'Informing as there is a new appointment in Board/Officers.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_weat.name,
          email: UserGroup.teams_committees_group_weat.metadata.email,
          message: 'Please add this to monthly digest.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_wic.name,
          email: UserGroup.teams_committees_group_wic.metadata.email,
          message: 'Informing as there is a new appointment in Board/Officers.',
        ),
      )
    when UserGroup.group_types[:banned_competitors]
      @to_list.push(
        UserRole::UserRoleEmailRecipient.new(
          name: 'WIC',
          email: UserGroup.teams_committees_group_wic.metadata.email,
          message: 'Informing as a competitor is newly banned.',
        ),
      )
    else
      raise "Unknown/Unhandled group type: #{role.group.group_type}"
    end

    # Send email.
    mail(
      to: [user_who_made_the_change.email, @to_list.map(&:email)].flatten.compact.uniq,
      reply_to: [user_who_made_the_change.email],
      subject: "New role added for #{role.user.name} in #{@group_type_name}",
    )
  end

  def notify_role_change(role, user_who_made_the_change, changes)
    @role = role
    @user_who_made_the_change = user_who_made_the_change
    @changes = JSON.parse changes
    @group_type_name = UserGroup.group_type_name[role.group_type.to_sym]
    @metadata = role_metadata(role)
    @today_date = Date.today
    @to_list = [wrt_email_recipient]

    # Populate the recepient list.
    case role.group_type
    when UserGroup.group_types[:delegate_probation]
      @to_list.push(
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.board_group.name,
          email: GroupsMetadataBoard.email,
          message: 'Informing as there was a change in Delegate probations.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: 'Senior Delegates',
          email: role.user.senior_delegates.map(&:email),
          message: 'Informing as there was a change in the probation status for one of the Delegates under you.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_wic.name,
          email: UserGroup.teams_committees_group_wic.metadata.email,
          message: 'Informing as there was a change in Delegate probations.',
        ),
      )
    when UserGroup.group_types[:delegate_regions]
      @to_list.push(
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.board_group.name,
          email: GroupsMetadataBoard.email,
          message: 'Informing as there was a change in Delegates.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_weat.name,
          email: UserGroup.teams_committees_group_weat.metadata.email,
          message: 'Please add this to monthly digest and if necessary create a GSuite account.',
        ),
      )
    when UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils]
      @to_list.push(
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.board_group.name,
          email: GroupsMetadataBoard.email,
          message: 'Informing as there was a change in a Team/Committee.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_weat.name,
          email: UserGroup.teams_committees_group_weat.metadata.email,
          message: 'Please add this to monthly digest.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: 'Team/Committee Leader',
          email: role.group.lead_user&.email,
          message: 'Informing as there was a change in your Team/Committee.',
        ),
      )
    when UserGroup.group_types[:banned_competitors]
      @to_list.push(
        UserRole::UserRoleEmailRecipient.new(
          name: 'WIC',
          email: UserGroup.teams_committees_group_wic.metadata.email,
          message: 'Informing as there was a change in banned details of a competitor.',
        ),
      )
    else
      raise "Unknown/Unhandled group type: #{role.group_type}"
    end

    # Send email.
    mail(
      to: [user_who_made_the_change.email, @to_list.map(&:email)].flatten.compact.uniq,
      reply_to: [user_who_made_the_change.email],
      subject: "Role changed for #{role.user.name} in #{@group_type_name}",
    )
  end

  def notify_role_end(role, user_who_made_the_change)
    @role = role
    @user_who_made_the_change = user_who_made_the_change
    @group_type_name = UserGroup.group_type_name[role.group_type.to_sym]
    @metadata = role_metadata(role)
    @to_list = [wrt_email_recipient]

    # Populate the recepient list.
    case role.group_type
    when UserGroup.group_types[:delegate_regions]
      @to_list.push(
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.board_group.name,
          email: GroupsMetadataBoard.email,
          message: 'Informing as there is a role end action for a Delegate.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_weat.name,
          email: UserGroup.teams_committees_group_weat.metadata.email,
          message: 'Please add this to monthly digest and if necessary suspend the GSuite & Slack account.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_wfc.name,
          email: UserGroup.teams_committees_group_wfc.metadata.email,
          message: 'Please take necessary action if there is a pending dues for the Delegate whose role is ended.',
        ),
      )
    when UserGroup.group_types[:translators]
      @to_list.push(
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_wst.name,
          email: UserGroup.teams_committees_group_wst.metadata.email,
          message: 'Informing as the role ended for a website translator.',
        ),
      )
    when UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils]
      @to_list.push(
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.board_group.name,
          email: GroupsMetadataBoard.email,
          message: 'Informing as there was a role end in a Team/Committee.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_weat.name,
          email: UserGroup.teams_committees_group_weat.metadata.email,
          message: 'Please add this to monthly digest and if necessary suspend the GSuite & Slack account.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: 'Team/Committee Leader',
          email: role.group.lead_user&.email,
          message: 'Informing as there is a role end in your Team/Committee.',
        ),
      )
    when UserGroup.group_types[:board], UserGroup.group_types[:officers]
      @to_list.push(
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.board_group.name,
          email: GroupsMetadataBoard.email,
          message: 'Informing as there is a role end in Board/Officers.',
        ),
        UserRole::UserRoleEmailRecipient.new(
          name: UserGroup.teams_committees_group_weat.name,
          email: UserGroup.teams_committees_group_weat.metadata.email,
          message: 'Please add this to monthly digest.',
        ),
      )
    else
      raise "Unknown/Unhandled group type: #{role.group.group_type}"
    end

    # Send email.
    mail(
      to: [user_who_made_the_change.email, @to_list.map(&:email)].flatten.compact.uniq,
      reply_to: [user_who_made_the_change.email],
      subject: "Role removed for #{role.user.name} in #{@group_type_name}",
    )
  end
end
