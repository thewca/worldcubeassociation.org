# frozen_string_literal: true

class ContactEditProfile < ContactForm
  attribute :wca_id
  attribute :changes_requested
  attribute :edit_profile_reason
  attribute :document, attachment: true

  EditProfileChange = Struct.new(
    :field,
    :from,
    :to,
  )

  def to_email
    UserGroup.teams_committees_group_wrt.metadata.email
  end

  def subject
    Time.now.strftime("Edit Profile request by #{wca_id} on %d %b %Y at %R")
  end

  def headers
    super.merge(template_name: "contact_edit_profile")
  end
end
