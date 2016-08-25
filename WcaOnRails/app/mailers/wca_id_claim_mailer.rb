# frozen_string_literal: true
class WcaIdClaimMailer < ApplicationMailer
  def notify_delegate_of_wca_id_claim(user_claiming_wca_id)
    @user_claiming_wca_id = user_claiming_wca_id
    mail(
      to: user_claiming_wca_id.delegate_to_handle_wca_id_claim.email,
      cc: user_claiming_wca_id.email,
      reply_to: user_claiming_wca_id.email,
      subject: "#{user_claiming_wca_id.email} just requested WCA ID #{user_claiming_wca_id.unconfirmed_wca_id}",
    )
  end

  def notify_user_of_delegate_demotion(user, delegate)
    @user = user
    @delegate = delegate
    mail(
      to: user.email,
      cc: delegate.email,
      reply_to: "notifications@worldcubeassociation.org",
      subject: "Repeat your WCA ID claim",
    )
  end
end
