# frozen_string_literal: true

class SubmitReportNagJob < ApplicationJob
  queue_as :default

  def nag_needed(competition)
    (competition.delegate_report.nag_sent_at || competition.end_date) <= 8.days.ago
  end

  def perform
    Competition
      .visible
      .includes(:delegate_report)
      .where("start_date >= ?", DelegateReport::REPORTS_ENABLED_DATE) # Don't send nag emails for very old competitions without reports.
      .where(delegate_reports: { posted_at: nil })
      .select { |c| nag_needed(c) }.each do |competition|
        competition.delegate_report.update_attribute(:nag_sent_at, Time.now)
        CompetitionsMailer.submit_report_nag(competition).deliver_now
      end
  end
end
