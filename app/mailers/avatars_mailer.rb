# frozen_string_literal: true

class AvatarsMailer < ApplicationMailer
  def notify_user_of_avatar_rejection(user, reason, attached_avatar: nil)
    @user = user
    @reason = reason
    @avatar_picture = attach_avatar_picture(attached_avatar)

    mail(
      from: UserGroup.teams_committees_group_wrt.metadata.email,
      to: user.email,
      reply_to: "results@worldcubeassociation.org",
      subject: "Your avatar has been rejected",
    )
  end

  def notify_user_of_avatar_removal(remover_user, user, reason, attached_avatar: nil)
    @remover = remover_user.results_team? ? 'the WCA Results Team' : remover_user.name
    @user = user
    @reason = reason
    @avatar_picture = attach_avatar_picture(attached_avatar)

    mail(
      from: UserGroup.teams_committees_group_wrt.metadata.email,
      to: user.email,
      subject: "Your avatar has been removed by #{@remover}",
    )
  end

  # Only ActiveStorage avatars keep their file around after being rejected or removed.
  #   Legacy backends have nothing we could attach, so the email goes out without the picture.
  private def attach_avatar_picture(avatar)
    return unless avatar&.active_storage? && avatar.attached?

    attachments.inline[avatar.filename] = {
      mime_type: avatar.image.content_type,
      content: avatar.image.download,
    }

    attachments[avatar.filename]
  end
end
