# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/competitions_mailer
class CompetitionsMailerPreview < ActionMailer::Preview
  def notify_board_of_confirmed_competition
    c = CompetitionDelegate.last.competition
    CompetitionsMailer.notify_board_of_confirmed_competition(c.delegates[0], c)
  end

  def notify_users_of_results_presence
    competition = Competition.joins(:results).where.not(results_posted_at: nil).last
    user = competition.competitor_users.last
    CompetitionsMailer.notify_users_of_results_presence(user, competition)
  end

  def submit_results_nag
    competition = Competition.last
    CompetitionsMailer.submit_results_nag(competition)
  end

  def notify_of_delegate_report_submission
    report = DelegateReport.where.not(posted_at: nil).first
    if !report
      report = Competition.first.delegate_report
      report.update_attributes!(schedule_url: "http://example.com", posted_by_user_id: User.last.id, posted_at: Time.now)
    end
    competition = report.competition
    CompetitionsMailer.notify_of_delegate_report_submission(competition)
  end
end
