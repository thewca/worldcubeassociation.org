# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/delegate_status_change_mailer
class DelegateStatusChangeMailerPreview < ActionMailer::Preview
  def notify_board_and_assistants_of_delegate_status_change
    mail = nil
    ActiveRecord::Base.transaction do
      user_whose_delegate_status_changed = User.where(delegate_status: "candidate_delegate").first
      user_whose_delegate_status_changed.delegate_status = "delegate"
      user_whose_delegate_status_changed.save!
      user_who_made_the_change = User.where(delegate_status: "senior_delegate").first
      mail = DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(
        user_whose_delegate_status_changed,
        user_who_made_the_change,
        user_who_made_the_change,
        user_whose_delegate_status_changed.delegate_status_before_last_save,
        user_whose_delegate_status_changed.delegate_status,
      )
      raise ActiveRecord::Rollback
    end
    mail
  end
end
