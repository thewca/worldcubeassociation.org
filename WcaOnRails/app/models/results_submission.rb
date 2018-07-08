# frozen_string_literal: true

class ResultsSubmission
  include ActiveModel::Model

  attr_accessor :message, :schedule_url, :competition_id

  validates :message, presence: true
  validates :competition_id, presence: true
  validates :schedule_url, presence: true, url: true

  validate do
    inbox_results = InboxResult.sorted_for_competition(competition_id)
    inbox_persons = InboxPerson.where(competitionId: competition_id)
    scrambles = Scramble.where(competitionId: competition_id)
    all_errors, _ = CompetitionResultsValidator.validate(inbox_persons, inbox_results, scrambles, competition_id)
    total_errors = all_errors.map { |key, value| value }.map(&:size).reduce(:+)
    if total_errors != 0
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
