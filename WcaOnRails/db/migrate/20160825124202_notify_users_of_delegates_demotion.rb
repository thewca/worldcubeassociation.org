# frozen_string_literal: true

class NotifyUsersOfDelegatesDemotion < ActiveRecord::Migration
  def change
    User.where.not(unconfirmed_wca_id: nil).each do |user|
      next if user.delegate_to_handle_wca_id_claim
      demoted_delegate = User.find_by_id(user.delegate_id_to_handle_wca_id_claim)
      # See why we need this `if` statement: https://github.com/thewca/worldcubeassociation.org/issues/889
      if demoted_delegate
        user.update! delegate_id_to_handle_wca_id_claim: nil, unconfirmed_wca_id: nil
        WcaIdClaimMailer.notify_user_of_delegate_demotion(user, demoted_delegate).deliver_later
      end
    end
  end
end
