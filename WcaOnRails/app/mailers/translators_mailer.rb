# frozen_string_literal: true

class TranslatorsMailer < ApplicationMailer
  def notify_translators_of_changes
    mail(
      to: "translators@worldcubeassociation.org",
      reply_to: ["software@worldcubeassociation.org"],
      subject: "There is new stuff awaiting translation",
    )
  end
end
