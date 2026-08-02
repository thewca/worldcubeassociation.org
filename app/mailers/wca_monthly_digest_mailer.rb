# frozen_string_literal: true

class WcaMonthlyDigestMailer < ApplicationMailer
  include MailersHelper

  def send_weat_digest_content
    @delegate_milestones = User.delegate_milestones_for_digest
    last_month = Time.now.beginning_of_month - 1.month
    mail(
      to: ["assistants@worldcubeassociation.org"],
      reply_to: ["assistants@worldcubeassociation.org"],
      subject: "WCA Monthly Digest Draft - #{last_month.strftime('%B %Y')}",
    )
  end
end
