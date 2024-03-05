# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/registrations_mailer
class RegistrationsMailerPreview < ActionMailer::Preview
  def notify_organizers_of_new_registration
    registration = Registration.pending.where.not(user_id: nil).first
    RegistrationsMailer.notify_organizers_of_new_registration(registration)
  end

  def notify_organizers_of_deleted_registration
    registration = Registration.pending.where.not(user_id: nil).first
    RegistrationsMailer.notify_organizers_of_deleted_registration(registration)
  end

  def notify_registrant_of_new_registration
    registration = Registration.pending.where.not(user_id: nil).first
    RegistrationsMailer.notify_registrant_of_new_registration(registration)
  end

  def notify_registrant_of_accepted_registration
    registration = Registration.accepted.where.not(user_id: nil).first
    RegistrationsMailer.notify_registrant_of_accepted_registration(registration)
  end

  def notify_registrant_of_pending_registration
    registration = Registration.pending.where.not(user_id: nil).first
    RegistrationsMailer.notify_registrant_of_pending_registration(registration)
  end

  def notify_registrant_of_deleted_registration
    registration = Registration.accepted.where.not(user_id: nil).first
    RegistrationsMailer.notify_registrant_of_deleted_registration(registration)
  end

  def notify_registrant_of_locked_account_creation
    RegistrationsMailer.notify_registrant_of_locked_account_creation(User.first, Competition.first)
  end
end
