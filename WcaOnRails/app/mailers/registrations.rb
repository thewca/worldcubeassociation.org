class RegistrationsMailer < ApplicationMailer
  def notify_organizers_of_new_registration(registration)
    @registration = registration
    mail(
      to: (registration.competition.organizers + registration.competition.delegates).map(&:email),
      subject: "#{registration.user.name} just registered for #{registration.competition.name}"
    )
  end

  def notify_registrant_of_new_registration(registration)
    @registration = registration
    mail(
      to: registration.user.email,
      subject: "You have registered for #{registration.competition.name}",
    )
  end

  def accepted_registration(registration)
    @registration = registration
    mail(
      to: registration.user.email,
      subject: "Your registration for #{registration.competition.name} has been approved!",
    )
  end
end
