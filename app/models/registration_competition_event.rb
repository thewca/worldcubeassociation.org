# frozen_string_literal: true

class RegistrationCompetitionEvent < ApplicationRecord
  belongs_to :registration, touch: true

  # We disable the "default" presence validation so that we can pass our own error information
  belongs_to :competition_event, optional: true
  validates :competition_event, presence: { message: :required, frontend_code: Registrations::ErrorCodes::INVALID_EVENT_SELECTION }

  has_one :event, through: :competition_event
  delegate :event, to: :competition_event, allow_nil: true
  delegate :id, to: :event, allow_nil: true, prefix: true

  has_one :user, through: :registration
  delegate :user, to: :registration, allow_nil: true

  delegate :allow_registration_without_qualification?, to: :registration

  validate :meets_qualifications, if: :competition_event, unless: :allow_registration_without_qualification?
  private def meets_qualifications
    errors.add(:competition_event, :not_qualified, message: I18n.t('registrations.errors.can_only_register_for_qualified_events'), frontend_code: Registrations::ErrorCodes::QUALIFICATION_NOT_MET) unless competition_event&.can_register?(user)
  end
end
