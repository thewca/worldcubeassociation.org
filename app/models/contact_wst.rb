# frozen_string_literal: true

class ContactWst < ContactForm
  attribute :message, validate: true
  attribute :request_id

  def to_email
    if request_id.present?
      UserGroup.teams_committees_group_wst.metadata.email
    else
      "contact@worldcubeassociation.org"
    end
  end

  def subject
    Time.now.strftime("[WCA Website] Software Comment by #{name} on %d %b %Y at %R")
  end
end
