# frozen_string_literal: true

class FixPersonalInformationContact < ContactForm
  attribute :wca_id, validate: :validate_wca_id
  attribute :dob, validate: :validate_dob
  attribute :gender, validate: User::ALLOWABLE_GENDERS.map(&:to_s)
  attribute :document, attachment: true, validate: true

  def validate_dob
    errors.add(:dob, I18n.t('mail_form.errors.fix_personal_information_contact.dob_invalid')) unless Date.safe_parse(dob)
  end

  def validate_wca_id
    errors.add(:wca_id, I18n.t('users.errors.not_found')) unless Person.find_by_wca_id(wca_id)
  end

  def headers
    super.merge(template_name: "fix_personal_information_contact")
  end
end
