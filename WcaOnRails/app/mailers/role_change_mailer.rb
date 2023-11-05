# frozen_string_literal: true

class RoleChangeMailer < ApplicationMailer
  def notify_start_probation(role, user_who_made_the_change)
    @role = role
    @user_who_made_the_change = user_who_made_the_change

    mail(
      to: [user_who_made_the_change.email, Team.board.email, role.user.senior_delegate.email],
      reply_to: [user_who_made_the_change.email],
      subject: "Delegate Probation started for #{role.user.name}",
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
