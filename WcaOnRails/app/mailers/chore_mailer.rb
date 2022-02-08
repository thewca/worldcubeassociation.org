# frozen_string_literal: true

class ChoreMailer < ApplicationMailer
  def notify_wst_of_assignee(assignee)
    @assignee = assignee

    start_of_month = Time.now.change(day: 1)
    end_of_month = start_of_month.change(day: Time.days_in_month(start_of_month.month))

    @month_name = start_of_month.strftime("%B")

    @pr_merged_this_month_url = "https://github.com/thewca/worldcubeassociation.org/pulls?utf8=%E2%9C%93&q=is%3Apr%20sort%3Amerged-desc%20merged%3A#{start_of_month.strftime("%F")}..#{end_of_month.strftime("%F")}"
    mail(
      to: "software@worldcubeassociation.org",
      cc: @assignee.email,
      reply_to: "software@worldcubeassociation.org",
      subject: "WST monthly digest for #{@month_name} is coming up",
    )
  end
end
