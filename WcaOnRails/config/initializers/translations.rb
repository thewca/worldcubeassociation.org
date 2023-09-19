# frozen_string_literal: true

# We only want to attempt to send email when the server is starting up.
# We don't want to send emails as a side effect of some rake script.
# See https://github.com/thewca/worldcubeassociation.org/issues/2085.
if Rails.env.production? && ENV.fetch('RAILS_RACKING', nil)
  Rails.configuration.after_initialize do
    modification_hash = ServerSetting.find_or_create_by!(name: ServerSetting::BASE_LOCALE_HASH)

    translation_base_file = "#{Rails.root}/config/locales/en.yml"
    latest_modification_hash = Digest::SHA256.file(translation_base_file).hexdigest

    if modification_hash.value && modification_hash.value != latest_modification_hash
      TranslatorsMailer.notify_translators_of_changes.deliver_later
    end

    modification_hash.update!(value: latest_modification_hash)
  end
end
