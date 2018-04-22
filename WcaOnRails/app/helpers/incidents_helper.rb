# frozen_string_literal: true

module IncidentsHelper
  def class_and_text_for_status(incident)
    if incident.resolved_at
      ["success", "Resolved"]
    else
      ["warning", "Pending"]
    end
  end

  def class_and_text_for_digest(incident)
    if incident.digest_worthy
      if incident.digest_sent_at
        ["success", "Sent"]
      else
        ["warning", "Pending"]
      end
    else
      ["success", "Not needed"]
    end
  end
end
