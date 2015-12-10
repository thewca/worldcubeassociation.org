# Preview all emails at http://localhost:3000/rails/mailers/wca_id_request_mailer
class WcaIdRequestMailerPreview < ActionMailer::Preview

  def notify_delegate_of_wca_id_request
    ActiveRecord::Base.transaction do
      user_requesting_wca_id = User.where.not(unconfirmed_wca_id: nil).first
      WcaIdRequestMailer.notify_delegate_of_wca_id_request(user_requesting_wca_id)
    end
  end

end
