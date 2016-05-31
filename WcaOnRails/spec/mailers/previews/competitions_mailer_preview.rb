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
end
