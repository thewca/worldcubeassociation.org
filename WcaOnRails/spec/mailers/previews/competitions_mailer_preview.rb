# Preview all emails at http://localhost:3000/rails/mailers/competitions_mailer
class CompetitionsMailerPreview < ActionMailer::Preview

  # Preview this email at http://localhost:3000/rails/mailers/competitions_mailer/notify_board_of_confirmed_competition
  def notify_board_of_confirmed_competition
    c = CompetitionDelegate.first.competition
    CompetitionsMailer.notify_board_of_confirmed_competition(c.delegates[0], c)
  end

  # Preview this email at http://localhost:3000/rails/mailers/competitions_mailer/notify_users_of_results_presence
  def notify_users_of_results_presence
    competition = Competition.joins(:results).where.not(results_posted_at: nil).first
    user = competition.competitor_users.first
    CompetitionsMailer.notify_users_of_results_presence(user, competition)
  end
end
