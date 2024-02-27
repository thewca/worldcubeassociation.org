# frozen_string_literal: true

class RegistrationsMailer < ApplicationMailer
  include MailersHelper

  def notify_organizers_of_new_registration(registration)
    @registration = registration
    organizer_user_ids = (
      registration.competition.competition_organizers.select(&:receive_registration_emails).map(&:organizer_id) +
      registration.competition.competition_delegates.select(&:receive_registration_emails).map(&:delegate_id)
    )
    to = User.where(id: organizer_user_ids).map(&:email)
    if to.empty?
      nil
    else
      mail(
        to: to,
        reply_to: [registration.user.email],
        subject: "#{registration.name} just registered for #{registration.competition.name}",
      )
    end
  end

  def notify_organizers_of_deleted_registration(registration)
    @registration = registration
    organizer_user_ids = (
      registration.competition.competition_organizers.select(&:receive_registration_emails).map(&:organizer_id) +
      registration.competition.competition_delegates.select(&:receive_registration_emails).map(&:delegate_id)
    )
    to = User.where(id: organizer_user_ids).map(&:email)
    if to.empty?
      nil
    else
      mail(
        to: to,
        reply_to: registration.competition.managers.map(&:email),
        subject: "#{registration.name} just deleted their registration for #{registration.competition.name}",
      )
    end
  end

  def notify_registrant_of_new_registration(registration)
    @registration = registration
    localized_mail @registration.user.locale,
                   -> { I18n.t('registrations.mailer.new.mail_subject', comp_name: registration.competition.name) },
                   to: registration.email,
                   reply_to: registration.competition.organizers_or_delegates.map(&:email)
  end

  def notify_registrant_of_accepted_registration(registration)
    @registration = registration
    localized_mail @registration.user.locale,
                   -> { I18n.t('registrations.mailer.accepted.mail_subject', comp_name: registration.competition.name) },
                   to: registration.email,
                   reply_to: registration.competition.organizers_or_delegates.map(&:email)
  end

  def notify_registrant_of_pending_registration(registration)
    @registration = registration
    localized_mail @registration.user.locale,
                   -> { I18n.t('registrations.mailer.pending.mail_subject', comp_name: registration.competition.name) },
                   to: registration.email,
                   reply_to: registration.competition.organizers_or_delegates.map(&:email)
  end

  def notify_registrant_of_deleted_registration(registration)
    @registration = registration
    localized_mail @registration.user.locale,
                   -> { I18n.t('registrations.mailer.deleted.mail_subject', comp_name: registration.competition.name) },
                   to: registration.email,
                   reply_to: registration.competition.organizers_or_delegates.map(&:email)
  end

  def notify_registrant_of_locked_account_creation(user, competition)
    @user = user
    @competition = competition
    mail(
      to: user.email,
      reply_to: competition.organizers_or_delegates.map(&:email),
      subject: "Unlock your new account on the WCA website",
    )
  end
end
