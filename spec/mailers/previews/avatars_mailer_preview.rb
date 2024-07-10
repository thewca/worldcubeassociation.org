# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/avatars_mailer
class AvatarsMailerPreview < ActionMailer::Preview
  def notify_user_of_avatar_rejection
    user = User.first
    reason = 'The avatar must not include texts other than regular background texts.'
    AvatarsMailer.notify_user_of_avatar_rejection(user, reason)
  end
end
