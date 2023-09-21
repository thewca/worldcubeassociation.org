# frozen_string_literal: true

class SubmitReportNagJob < WcaCronjob
  def nag_needed?(competition)
    (competition.delegate_report.nag_sent_at || competition.end_date) <= 8.days.ago
  end

  def reminder_needed?(competition)
    competition.delegate_report.reminder_sent_at.blank? && 6.days.since(competition.end_date).today?
  end

  def perform
    competitions =
      Competition
      .visible
      .not_cancelled
      .includes(:delegate_report)
      .where("start_date >= ?", DelegateReport::REPORTS_ENABLED_DATE) # Don't send nag emails for very old competitions without reports.
      .where(delegate_reports: { posted_at: nil })

    competitions.each do |competition|
      if reminder_needed?(competition)
        send_reminder(competition)
      elsif nag_needed?(competition)
        send_nag(competition)
      end
    end
  end

  private

    def send_nag(competition)
      competition.delegate_report.update(nag_sent_at: Time.now)
      CompetitionsMailer.submit_report_nag(competition).deliver_now
    end

    def send_reminder(competition)
      competition.delegate_report.update(reminder_sent_at: Time.now)
      CompetitionsMailer.submit_report_reminder(competition).deliver_now
    end
end
