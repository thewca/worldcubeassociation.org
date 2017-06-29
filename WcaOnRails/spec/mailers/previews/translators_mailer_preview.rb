# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/translators_mailer
class TranslatorsMailerPreview < ActionMailer::Preview
  def notify_translators_of_changes
    TranslatorsMailer.notify_translators_of_changes
  end
end
