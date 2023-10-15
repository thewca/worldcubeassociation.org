# frozen_string_literal: true

module NotificationsHelper
  def notifications_for_user(user)
    notifications = []
    if user.competition_announcement_team?
      # Show WCAT members:
      #  - Confirmed, but not visible competitions: They need to approve or reject
      #                                             these competitions.
      #  - Unconfirmed, but visible competitions: These competitions should be confirmed
      #                                           so people cannot change old competitions.
      Competition.confirmed.not_visible.each do |competition|
        notifications << {
          text: "#{competition.name} is pending announcement. The competition is happening in #{competition.days_until} days.",
          url: competition_admin_edit_path(competition),
        }
      end
      Competition.not_confirmed.visible.each do |competition|
        notifications << {
          text: "#{competition.name} is visible, but unlocked",
          url: competition_admin_edit_path(competition),
        }
      end
    end

    if user.wca_id.blank?
      notifications << if user.unconfirmed_wca_id? && user.delegate_to_handle_wca_id_claim
                         # The user has already claimed a WCA ID, let them know we're on it.
                         {
                           text: "Waiting for #{user.delegate_to_handle_wca_id_claim.name} to assign you WCA ID #{user.unconfirmed_wca_id}",
                           url: profile_claim_wca_id_path,
                         }
                       else
                         # Show users without WCA IDs how to claim a WCA ID for their account.
                         {
                           text: I18n.t('notifications.connect_wca_id'),
                           url: profile_claim_wca_id_path,
                         }
                       end
    end

    # Show all the users who are waiting to have their WCA ID claims approved.
    # Note that it is possible for users who have not yet confirmed their accounts
    # to have claimed a WCA ID, as we support claiming a WCA ID as part of signing up
    # for an account. We don't want to bother delegates with these claims until
    # the user has confirmed their account, though, so filter out users with
    # confirmed_at=NULL.
    user.confirmed_users_claiming_wca_id.each do |user_claiming_wca_id|
      notifications << {
        text: "#{user_claiming_wca_id.email} has claimed WCA ID #{user_claiming_wca_id.unconfirmed_wca_id}",
        url: edit_user_path(user_claiming_wca_id.id, anchor: "wca_id"),
      }
    end

    unless user.cannot_register_for_competition_reasons.empty?
      notifications << {
        text: "Your profile is incomplete. You will not be able to register for competitions until you complete it!",
        url: profile_edit_path,
      }
    end

    user.actually_delegated_competitions.order_by_date
        .includes(:delegate_report, :delegates).where(delegate_reports: { posted_at: nil })
        .each do |competition|
          if competition.user_should_post_delegate_report?(user)
            notifications << {
              text: "The delegate report for #{competition.name} has not been submitted.",
              url: delegate_report_path(competition),
            }
          end
        end

    user.actually_delegated_competitions.order_by_date
        .each do |competition|
          if competition.user_should_post_competition_results?(user)
            notifications << {
              text: "The competition results for #{competition.name} have not been submitted.",
              url: competition_submit_results_edit_path(competition),
            }
          end
        end

    notifications
  end
end
