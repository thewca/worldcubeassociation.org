# frozen_string_literal: true

class DelegateStatusChangeMailer < ApplicationMailer
  def notify_board_and_wqac_of_delegate_status_change(user_whose_delegate_status_changed, user_who_made_the_change)
    I18n.with_locale :en do
      @user_whose_delegate_status_changed = user_whose_delegate_status_changed
      @user_who_made_the_change = user_who_made_the_change
      if user_whose_delegate_status_changed.delegate_status
        if user_whose_delegate_status_changed.delegate_status == "senior_delegate"
          @user_senior_delegate = user_whose_delegate_status_changed
        else
          @user_senior_delegate = user_whose_delegate_status_changed.senior_delegate
        end
      else
        @user_senior_delegate = User.find_by_id!(user_whose_delegate_status_changed.senior_delegate_id_before_last_save)
      end
      to = ["board@worldcubeassociation.org"]
      cc = ["quality@worldcubeassociation.org", user_who_made_the_change.email, @user_senior_delegate.email]
      mail(
        to: to,
        cc: cc,
        reply_to: [user_who_made_the_change.email],
        subject: "#{user_who_made_the_change.name} just changed the Delegate status of #{user_whose_delegate_status_changed.name}",
      )
    end
  end
end
