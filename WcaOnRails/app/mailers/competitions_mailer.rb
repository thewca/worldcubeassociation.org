class CompetitionsMailer < ApplicationMailer
  def notify_board_of_confirmed_competition(confirmer, competition)
    @competition = competition
    @confirmer = confirmer
    mail(
      to: "board@worldcubeassociation.org",
      cc: competition.delegates.pluck(:email),
      reply_to: confirmer.email,
      subject: "#{confirmer.name} just confirmed #{competition.name}"
    )
  end

  def notify_users_of_results_presence(user, competition)
    @competition = competition
    @user = user
    mail(
      to: user.email,
      subject: "The results of #{competition.name} are posted"
    )
  end
end
