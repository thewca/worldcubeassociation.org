class CompetitionsMailer < ApplicationMailer
  # Subject can be set in your I18n file at config/locales/en.yml
  # with the following lookup:
  #
  #   en.competitions_mailer.notify_board_of_confirmed_competition.subject
  #
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
