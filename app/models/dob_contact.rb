# frozen_string_literal: true

class DobContact < ContactForm
  attribute :dob, validate: :validate_dob
  attribute :wca_id, validate: :validate_wca_id
  attribute :document, attachment: true, validate: true

  def validate_dob
    errors.add(:dob, I18n.t('mail_form.errors.dob_contact.dob_invalid')) unless Date.safe_parse(dob)
  end

  def validate_wca_id
    errors.add(:wca_id, I18n.t('users.errors.not_found')) unless Person.find_by_wca_id(wca_id)
  end

  def headers
    super.merge(template_name: "dob_contact")
  end

  def incorrect_wca_id_claim_count
    Person.find_by_wca_id(wca_id)&.incorrect_wca_id_claim_count
  end
end
