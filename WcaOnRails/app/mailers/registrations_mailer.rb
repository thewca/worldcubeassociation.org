class RegistrationsMailer < ApplicationMailer

  def notify_organizers_of_new_registration(registration)
    @registration = registration
    organizer_user_ids = (registration.competition.competition_organizers.select(&:receive_registration_emails).map(&:organizer_id) + registration.competition.competition_delegates.select(&:receive_registration_emails).map(&:delegate_id))
    to = User.where(id: organizer_user_ids).map(&:email)
    if to.length > 0
      mail(
        to: to,
        reply_to: registration.competition.managers.map(&:email),
        subject: "#{registration.name} just registered for #{registration.competition.name}"
      )
    else
      nil
    end
  end

  def notify_registrant_of_new_registration(registration)
    @registration = registration
    mail(
      to: registration.email,
      reply_to: registration.competition.managers.map(&:email),
      subject: "You have registered for #{registration.competition.name}",
    )
  end

  def notify_registrant_of_accepted_registration(registration)
    @registration = registration
    mail(
      to: registration.email,
      reply_to: registration.competition.managers.map(&:email),
      subject: "Your registration for #{registration.competition.name} has been accepted",
    )
  end

  def notify_registrant_of_pending_registration(registration)
    @registration = registration
    mail(
      to: registration.email,
      reply_to: registration.competition.managers.map(&:email),
      subject: "You have been moved to the waiting list for #{registration.competition.name}",
    )
  end

  def notify_registrant_of_deleted_registration(registration)
    @registration = registration
    mail(
      to: registration.email,
      reply_to: registration.competition.managers.map(&:email),
      subject: "Your registration for #{registration.competition.name} has been deleted",
    )
  end
end
