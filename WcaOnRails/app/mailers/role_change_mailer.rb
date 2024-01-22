# frozen_string_literal: true

class RoleChangeMailer < ApplicationMailer
  def notify_role_start(role, user_who_made_the_change)
    @role = role
    @user_who_made_the_change = user_who_made_the_change
    @group_type_name = UserGroup.group_type_name[@role.group.group_type.to_sym]

    # Populate the recepient list.
    case role.group.group_type
    when UserGroup.group_types[:delegate_probation]
      to_list = [user_who_made_the_change.email, Team.board.email, role.user.senior_delegate.email]
      reply_to_list = [user_who_made_the_change.email]
    when UserGroup.group_types[:delegate_regions]
      to_list = [user_who_made_the_change.email, role.user.senior_delegate.email]
      reply_to_list = [user_who_made_the_change.email]
    else
      raise "Unknown/Unhandled group type: #{role.group.group_type}"
    end

    # Send email.
    mail(
      to: to_list,
      reply_to: reply_to_list,
      subject: "New role added for #{role.user.name} in #{@group_type_name}",
    )
  end

  def notify_change_probation_end_date(role, user_who_made_the_change)
    @role = role
    @user_who_made_the_change = user_who_made_the_change

    mail(
      to: [user_who_made_the_change.email, Team.board.email, role.user.senior_delegate.email],
      reply_to: [user_who_made_the_change.email],
      subject: "Delegate Probation end date changed for #{role.user.name}",
    )
  end
end
