# frozen_string_literal: true

class DumpPayloadDatabase < WcaCronjob
  before_enqueue do
    # Staging shares the public dump location with production, so only the live site may overwrite it
    throw :abort unless EnvConfig.WCA_LIVE_SITE?
  end

  def perform
    DbDumpHelper.dump_payload_db
  end
end
