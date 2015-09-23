# Preview all emails at http://localhost:3000/rails/mailers/competitions_mailer
class CompetitionsMailerPreview < ActionMailer::Preview

  # Preview this email at http://localhost:3000/rails/mailers/competitions_mailer/notify_board_of_confirmed_competition
  def notify_board_of_confirmed_competition
    c = CompetitionDelegate.first.competition
    CompetitionsMailer.notify_board_of_confirmed_competition(c.delegates[0], c)
  end

end
