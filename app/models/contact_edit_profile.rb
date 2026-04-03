# frozen_string_literal: true

class ContactEditProfile < ContactForm
  attribute :wca_id
  attribute :changes_requested
  attribute :edit_profile_reason
  attribute :requestor_user
  attribute :ticket
  attribute :document, attachment: true

  EditProfileChange = Struct.new(
    :field,
    :from,
    :to,
  )

  def value_humanized(value, field)
    case field
    when :country_iso2
      Country.c_find_by_iso2(value).name_in(:en)
    when :gender
      User::GENDER_LABEL_METHOD.call(value.to_sym)
    else
      value
    end
  end

  def requestor_info
    edit_others_profile_mode = requestor_user.wca_id != wca_id
    requestor_role = if !edit_others_profile_mode
                       "Self"
                     elsif requestor_user.any_kind_of_delegate?
                       "Delegate"
                     else
                       "Unknown"
                     end
    "#{requestor_user.name} (#{requestor_role})"
  end

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
