# frozen_string_literal: true

class AvatarsMailer < ApplicationMailer
  def notify_user_of_avatar_rejection(user, reason)
    @user = user
    @reason = reason

    mail(
      from: Team.wrt.email,
      to: user.email,
      reply_to: "results@worldcubeassociation.org",
      subject: "Your avatar has been rejected",
    )
  end

  def notify_user_of_avatar_removal(remover_user, user, reason)
    @remover = remover_user.results_team? ? 'the WCA Results Team' : remover_user.name
    @user = user
    @reason = reason

    mail(
      from: Team.wrt.email,
      to: user.email,
      subject: "Your avatar has been removed by #{@remover}",
    )
  end
end
