# frozen_string_literal: true

class DelegateStatusChangeMailer < ApplicationMailer
  def notify_board_and_assistants_of_delegate_status_change(
    user_whose_delegate_status_changed,
    user_who_made_the_change,
    user_senior_delegate,
    previous_delegate_status,
    new_delegate_status
  )
    I18n.with_locale :en do
      @user_whose_delegate_status_changed = user_whose_delegate_status_changed
      @user_who_made_the_change = user_who_made_the_change
      @user_senior_delegate = user_senior_delegate

      @previous_delegate_status = previous_delegate_status
      @new_delegate_status = new_delegate_status

      @is_changed_by_senior_of_user = user_who_made_the_change.id == user_senior_delegate.id
      to = ["board@worldcubeassociation.org"]
      cc = ["assistants@worldcubeassociation.org", "finance@worldcubeassociation.org", user_who_made_the_change.email, @user_senior_delegate.email]
      mail(
        to: to,
        cc: cc,
        reply_to: [user_who_made_the_change.email],
        subject: "#{user_who_made_the_change.name} just changed the Delegate status of #{user_whose_delegate_status_changed.name}",
      )
    end
  end
end
