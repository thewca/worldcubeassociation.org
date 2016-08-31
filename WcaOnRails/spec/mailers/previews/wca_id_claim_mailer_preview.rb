# frozen_string_literal: true
# Preview all emails at http://localhost:3000/rails/mailers/wca_id_claim_mailer
class WcaIdClaimMailerPreview < ActionMailer::Preview

  def notify_delegate_of_wca_id_claim
    ActiveRecord::Base.transaction do
      user_claiming_wca_id = User.where.not(unconfirmed_wca_id: nil).first
      WcaIdClaimMailer.notify_delegate_of_wca_id_claim(user_claiming_wca_id)
    end
  end

end
