# Preview all emails at http://localhost:3000/rails/mailers/registrations
class RegistrationsPreview < ActionMailer::Preview

  # Preview this email at http://localhost:3000/rails/mailers/registrations/new_registration
  def new_registration
    Registrations.new_registration
  end

  # Preview this email at http://localhost:3000/rails/mailers/registrations/notify_registrant_of_accepted_registration
  def notify_registrant_of_accepted_registration
    Registrations.notify_registrant_of_accepted_registration
  end

end
