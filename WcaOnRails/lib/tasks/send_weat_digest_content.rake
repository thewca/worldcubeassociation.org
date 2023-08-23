# frozen_string_literal: true

namespace :send_weat_digest_content do
  desc 'Send WEAT Monthly Digest content'
  task generate: :environment do
    WcaMonthlyDigestMailer.send_weat_digest_content.deliver_later
  end
end
