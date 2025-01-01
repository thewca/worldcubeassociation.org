# frozen_string_literal: true

class NotifyTranslatorsJob < WcaCronjob
  before_enqueue do
    # NOTE: we want to only do this on the actual "production" server, as we need the real users' emails.
    throw :abort unless EnvConfig.WCA_LIVE_SITE?
  end

  def perform
    modification_hash = ServerSetting.find_or_create_by!(name: ServerSetting::BASE_LOCALE_HASH)

    translation_base_file = "#{Rails.root}/config/locales/en.yml"
    latest_modification_hash = Digest::SHA256.file(translation_base_file).hexdigest

    if modification_hash.value && modification_hash.value != latest_modification_hash
      TranslatorsMailer.notify_translators_of_changes.deliver_later
    end

    modification_hash.update!(value: latest_modification_hash)
  end
end
