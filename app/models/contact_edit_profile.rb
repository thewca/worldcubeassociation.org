# frozen_string_literal: true

class ContactEditProfile < ContactForm
  attribute :wca_id
  attribute :changes_requested
  attribute :edit_profile_reason
  attribute :requestor
  attribute :ticket
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
    Time.now.strftime("Edit Profile request for the profile of #{wca_id} at %d %b %Y at %R")
  end

  def headers
    super.merge(template_name: "contact_edit_profile")
  end
end
