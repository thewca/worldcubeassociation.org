# frozen_string_literal: true

class ResultsSubmission
  include ActiveModel::Model

  attr_accessor :message, :schedule_url, :competition_id

  validates :message, presence: true
  validates :competition_id, presence: true
  validates :schedule_url, presence: true, url: true

  validate do
    results_validator = CompetitionResultsValidator.new(competition_id)
    if results_validator.total_errors != 0
      # this shouldn't actually happen through a "normal" usage of the website
      errors.add(:message, "submitted results contain errors")
    end
  end

  # FIXME: what is this used for?
  def ==(other)
    self.class == other.class && self.state == other.state
  end

  def state
    [message]
  end
end
