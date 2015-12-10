class WcaIdRequestMailer < ApplicationMailer
  def notify_delegate_of_wca_id_request(user_requesting_wca_id)
    @user_requesting_wca_id = user_requesting_wca_id
    mail(
      to: user_requesting_wca_id.delegate_to_handle_wca_id_request.email,
      cc: user_requesting_wca_id.email,
      reply_to: user_requesting_wca_id.email,
      subject: "#{user_requesting_wca_id.email} just requested WCA id #{user_requesting_wca_id.unconfirmed_wca_id}",
    )
  end
end
