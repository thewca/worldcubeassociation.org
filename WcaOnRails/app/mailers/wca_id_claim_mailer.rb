class WcaIdClaimMailer < ApplicationMailer
  def notify_delegate_of_wca_id_claim(user_claiming_wca_id)
    @user_claiming_wca_id = user_claiming_wca_id
    mail(
      to: user_claiming_wca_id.delegate_to_handle_wca_id_claim.email,
      cc: user_claiming_wca_id.email,
      reply_to: user_claiming_wca_id.email,
      subject: "#{user_claiming_wca_id.email} just requested WCA id #{user_claiming_wca_id.unconfirmed_wca_id}",
    )
  end
end
