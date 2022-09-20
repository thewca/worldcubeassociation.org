# frozen_string_literal: true

class MailerPreviews::CompetitionsMailerPreview < ActionMailer::Preview
  def submit_report_reminder
    competition = Competition.order(created_at: :desc).first
    CompetitionsMailer.submit_report_reminder(competition)
  end
end
