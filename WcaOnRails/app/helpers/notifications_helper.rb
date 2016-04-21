module NotificationsHelper
  def notifications_for_user(user)
    notifications = []
    # Be careful to not show a competition twice if we're both organizing and delegating it.
    unconfirmed_competitions = (user.delegated_competitions.where(isConfirmed: false) + user.organized_competitions.where(isConfirmed: false)).uniq(&:id)
    unconfirmed_competitions.each do |unconfirmed_competition|
      notifications << {
        text: "#{unconfirmed_competition.name} is not confirmed",
        url: edit_competition_path(unconfirmed_competition),
      }
    end
    if user.board_member?
      # Show board members:
      #  - Confirmed, but not visible competitions: They need to approve or reject
      #                                             these competitions.
      #  - Unconfirmed, but visible competitions: These competitions should be confirmed
      #                                           so people cannot change old competitions.
      Competition.where(isConfirmed: true, showAtAll: false).each do |competition|
        notifications << {
          text: "#{competition.name} is waiting to be announced",
          url: admin_edit_competition_path(competition),
        }
      end
      Competition.where(isConfirmed: false, showAtAll: true).each do |competition|
        notifications << {
          text: "#{competition.name} is visible, but unlocked",
          url: admin_edit_competition_path(competition),
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
                           text: "Connect your WCA ID to your account!",
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
    user.users_claiming_wca_id.where.not(confirmed_at: nil).each do |user_claiming_wca_id|
      notifications << {
        text: "#{user_claiming_wca_id.email} has claimed WCA ID #{user_claiming_wca_id.unconfirmed_wca_id}",
        url: edit_user_path(user_claiming_wca_id.id, anchor: "wca_id"),
      }
    end

    if user.cannot_register_for_competition_reasons.length > 0
      notifications << {
        text: "Your profile is incomplete. You will not be able to register for competitions until you complete it!",
        url: profile_edit_path,
      }
    end

    notifications
  end
end
