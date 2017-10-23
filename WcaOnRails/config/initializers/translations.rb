# frozen_string_literal: true

# We only want to attempt to send email when the server is starting up.
# We don't want to send emails as a side effect of some rake script.
# See https://github.com/thewca/worldcubeassociation.org/issues/2085.
if Rails.env.production? && ENV['RAILS_RACKING']
  Rails.configuration.after_initialize do
    modification_timestamp = Timestamp.find_or_create_by!(name: 'en_translation_modification')
    latest_modification_date = Time.parse(`git log -1 --format='%ai' #{Rails.root.to_s}/config/locales/en.yml`)
    if modification_timestamp.date && modification_timestamp.date < latest_modification_date
      TranslatorsMailer.notify_translators_of_changes.deliver_later
    end
    modification_timestamp.update!(date: latest_modification_date)
  end
end
