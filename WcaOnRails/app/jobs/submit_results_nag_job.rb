# frozen_string_literal: true

class SubmitResultsNagJob < WcaCronjob
  def nag_needed(competition)
    (competition.results_nag_sent_at || competition.end_date) <= 8.days.ago
  end

  def perform
    Competition
      .visible
      .not_cancelled
      .where(results_submitted_at: nil)
      .select { |c| nag_needed(c) }.each do |competition|
      competition.update_attribute(:results_nag_sent_at, Time.now)
      CompetitionsMailer.submit_results_nag(competition).deliver_now
    end
  end
end
