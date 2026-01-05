# frozen_string_literal: true

class SanityCheckMailer < ApplicationMailer
  def notify_of_sanity_check_results(email_to)
    results = SanityCheckCategory.where(email_to: email_to).flat_map(:latest_results)
    @non_empty_results = results.filter { |r| !r.results_without_exclusions.empty? }

    start_of_month = Time.now.change(day: 1)

    month_name = start_of_month.strftime("%B")
    year_name = start_of_month.strftime("%Y")
    mail(
      to: email_to,
      cc: "software@worldcubeassociation.org",
      subject: "Sanity Check #{month_name} #{year_name}",
    )
  end
end
