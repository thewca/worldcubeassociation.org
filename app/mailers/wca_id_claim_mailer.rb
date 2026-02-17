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

  def notify_user_of_claim_cancelled(user, unconfirmed_wca_id)
    @user = user
    @unconfirmed_wca_id = unconfirmed_wca_id
    mail(
      to: user.email,
      subject: "Your WCA ID claim for #{unconfirmed_wca_id} has been cancelled",
    )
  end

  def notify_user_of_delegate_demotion(user, delegate, senior_delegate = nil)
    @user = user
    @delegate = delegate
    reply_to = ["board@worldcubeassociation.org"]
    reply_to << senior_delegate.email if senior_delegate
    mail(
      to: user.email,
      cc: reply_to,
      reply_to: reply_to,
      subject: "Repeat your WCA ID claim",
    )
  end
end
