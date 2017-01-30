# frozen_string_literal: true
class RegistrationsMailer < ApplicationMailer

  def notify_organizers_of_new_registration(registration)
    @registration = registration
    organizer_user_ids = (registration.competition.competition_organizers.select(&:receive_registration_emails).map(&:organizer_id) + registration.competition.competition_delegates.select(&:receive_registration_emails).map(&:delegate_id))
    to = User.where(id: organizer_user_ids).map(&:email)
    if to.empty?
      nil
    else
      mail(
        to: to,
        reply_to: [registration.user.email],
        subject: "#{registration.name} just registered for #{registration.competition.name}"
      )
    end
  end

  def notify_organizers_of_deleted_registration(registration)
    @registration = registration
    organizer_user_ids = (registration.competition.competition_organizers.select(&:receive_registration_emails).map(&:organizer_id) + registration.competition.competition_delegates.select(&:receive_registration_emails).map(&:delegate_id))
    to = User.where(id: organizer_user_ids).map(&:email)
    if to.empty?
      nil
    else
      mail(
        to: to,
        reply_to: registration.competition.managers.map(&:email),
        subject: "#{registration.name} just deleted their registration for #{registration.competition.name}"
      )
    end
  end

  def notify_registrant_of_new_registration(registration)
    @registration = registration
    I18n.with_locale @registration.user.locale do
      mail(
        to: registration.email,
        reply_to: registration.competition.organizers_or_delegates.map(&:email),
        subject: I18n.t('registrations.mailer.new.mail_subject', comp_name: registration.competition.name),
      )
    end
  end

  def notify_registrant_of_accepted_registration(registration)
    @registration = registration
    I18n.with_locale @registration.user.locale do
      mail(
        to: registration.email,
        reply_to: registration.competition.organizers_or_delegates.map(&:email),
        subject: I18n.t('registrations.mailer.accepted.mail_subject', comp_name: registration.competition.name),
      )
    end
  end

  def notify_registrant_of_pending_registration(registration)
    @registration = registration
    I18n.with_locale @registration.user.locale do
      mail(
        to: registration.email,
        reply_to: registration.competition.organizers_or_delegates.map(&:email),
        subject: I18n.t('registrations.mailer.pending.mail_subject', comp_name: registration.competition.name),
      )
    end
  end

  def notify_registrant_of_deleted_registration(registration)
    @registration = registration
    I18n.with_locale @registration.user.locale do
      mail(
        to: registration.email,
        reply_to: registration.competition.organizers_or_delegates.map(&:email),
        subject: I18n.t('registrations.mailer.deleted.mail_subject', comp_name: registration.competition.name),
      )
    end
  end
end
