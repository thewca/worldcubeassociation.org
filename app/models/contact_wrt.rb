# frozen_string_literal: true

class ContactWrt < ContactForm
  attribute :message, validate: true

  def to_email
    UserGroup.teams_committees_group_wrt.metadata.email
  end

  def subject
    Time.now.strftime("[WCA Website] Results Team Comment by #{name} on %d %b %Y at %R")
  end
end
