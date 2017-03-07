# frozen_string_literal: true
class DobContact < ContactForm
  attribute :dob, validate: true
  attribute :wca_id, validate: :validate_wca_id
  attribute :document, attachment: true, validate: true

  def validate_wca_id
    errors.add(:wca_id, I18n.t('users.errors.not_found')) unless Person.find_by_wca_id(wca_id)
  end

  def headers
    super.merge(template_name: "dob_contact")
  end
end
