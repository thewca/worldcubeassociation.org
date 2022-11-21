# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/competitions_mailer
class CompetitionsMailerPreview < ActionMailer::Preview
  def notify_wcat_of_confirmed_competition
    c = CompetitionDelegate.last.competition
    CompetitionsMailer.notify_wcat_of_confirmed_competition(c.delegates[0], c)
  end

  def notify_organizer_of_confirmed_competition
    c = CompetitionDelegate.last.competition
    CompetitionsMailer.notify_organizer_of_confirmed_competition(c.delegates[0], c)
  end

  def notify_organizer_of_announced_competition
    c = CompetitionDelegate.last.competition
    p = "dummy_link"
    CompetitionsMailer.notify_organizer_of_announced_competition(c, p)
  end

  def notify_organizer_of_addition_to_competition
    c = CompetitionDelegate.last.competition
    CompetitionsMailer.notify_organizer_of_addition_to_competition(c.delegates[0], c, c.organizers[0])
  end

  def notify_organizer_of_removal_from_competition
    c = CompetitionDelegate.last.competition
    CompetitionsMailer.notify_organizer_of_removal_from_competition(c.delegates[0], c, c.organizers[0])
  end

  def notify_board_of_confirmed_championship_competition
    c = Competition.find("WC2013")
    CompetitionsMailer.notify_wcat_of_confirmed_competition(c.delegates[0], c)
  end

  def notify_users_of_results_presence
    competition = Competition.joins(:results).where.not(results_posted_at: nil).last
    user = competition.competitor_users.last
    CompetitionsMailer.notify_users_of_results_presence(user, competition)
  end

  def submit_results_nag
    CompetitionsMailer.submit_results_nag(Competition.find("Euro2018"))
  end

  def submit_report_nag
    CompetitionsMailer.submit_report_nag(Competition.find("Euro2018"))
  end

  def notify_of_delegate_report_submission
    report = DelegateReport.where.not(posted_at: nil).first
    if !report
      report = Competition.first.delegate_report
      report.update!(schedule_url: "http://example.com", posted_by_user_id: User.last.id, posted_at: Time.now)
    end
    competition = report.competition
    CompetitionsMailer.notify_of_delegate_report_submission(competition)
  end

  def wrc_delegate_report_followup
    report = DelegateReport.where.not(posted_at: nil).first

    # Copied from `app/controllers/delegate_reports_controller.rb`
    Team.wrc.reload
    wrc_primary_team_member, wrc_secondary_team_member = Team.wrc.current_members.sample 2
    report.wrc_primary_user = wrc_primary_team_member.user
    report.wrc_secondary_user = wrc_secondary_team_member.user

    if !report
      report = Competition.first.delegate_report
      report.update!(schedule_url: "http://example.com", posted_by_user_id: User.last.id, posted_at: Time.now)
    end
    competition = report.competition
    CompetitionsMailer.wrc_delegate_report_followup(competition)
  end

  def results_submitted
    results_submission = FactoryBot.build :results_submission
    CompetitionsMailer.results_submitted(Competition.last, results_submission, User.first)
  end

  def submit_report_reminder
    competition = Competition.order(created_at: :desc).first
    CompetitionsMailer.submit_report_reminder(competition)
  end
end
