# frozen_string_literal: true

if defined?(Rails::Server) # See: https://stackoverflow.com/a/44441168
  Rails.configuration.after_initialize do
    modification_timestamp = Timestamp.find_or_create_by!(name: 'en_translation_modification')
    latest_modification_date = DateTime.parse(`git log -1 --format='%ai' #{Rails.root.to_s}/config/locales/en.yml`)
    if modification_timestamp.date && modification_timestamp.date < latest_modification_date
      TranslatorsMailer.notify_translators_of_changes.deliver_later
    end
    modification_timestamp.update!(date: latest_modification_date)
  end
end
