# frozen_string_literal: true

class ResultsSubmission
  include ActiveModel::Model

  attr_accessor :message, :schedule_url, :competition_id, :confirm_information

  validates :message, presence: true
  validates :competition_id, presence: true
  CONFIRM_INFORMATION_ERROR = "You must confirm the information is accurate"
  validates :confirm_information, acceptance: { message: CONFIRM_INFORMATION_ERROR, allow_nil: false }
  validates :schedule_url, presence: true, url: true

  validate do
    if results_validator.any_errors?
      # this shouldn't actually happen through a "normal" usage of the website
      errors.add(:message, "submitted results contain errors")
    end
  end

  def results_validator
    @results_validator ||= ResultsValidators::CompetitionsResultsValidator.create_full_validation.validate(competition_id)
  end

  # This is used in specs to compare two ResultsSubmission
  # See spec/requests/results_submission_spec.rb
  def ==(other)
    self.class == other.class && self.state == other.state
  end

  def state
    [message]
  end
end
