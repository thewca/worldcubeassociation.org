# frozen_string_literal: true
class AvatarsMailer < ApplicationMailer
  def notify_user_of_avatar_rejection(user, reason)
    @user = user
    @reason = reason

    mail(
      to: user.email,
      reply_to: "results@worldcubeassociation.org",
      subject: "Your avatar has been rejected",
    )
  end
end
