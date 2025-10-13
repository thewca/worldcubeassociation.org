# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/translators_mailer
class TranslatorsMailerPreview < ActionMailer::Preview
  delegate :notify_translators_of_changes, to: :TranslatorsMailer
end
