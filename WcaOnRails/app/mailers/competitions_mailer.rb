class CompetitionsMailer < ApplicationMailer
  def notify_board_of_confirmed_competition(confirmer, competition)
    @competition = competition
    mail(
      to: "board@worldcubeassociation.org",
      cc: competition.delegates.pluck(:email),
      reply_to: confirmer.email,
      subject: "#{confirmer.name} just confirmed #{competition.name}"
    )
  end
end
