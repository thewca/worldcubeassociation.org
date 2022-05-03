# frozen_string_literal: true

class WcaMonthlyDigestMailer < ApplicationMailer
  include MailersHelper

  def send_weat_digest_content
    mail(
      to: ["board@worldcubeassociation.org", "assistants@worldcubeassociation.org"],
      reply_to: ["board@worldcubeassociation.org", "assistants@worldcubeassociation.org"],
      subject: "WCA Monthly Digest Draft",
    )
  end
end
