class SubmitResultsNagJob < ActiveJob::Base
  queue_as :default

  def nag_needed(competition)
    (competition.results_nag_sent_at || competition.end_date) <= 1.week.ago
  end

  def perform
    Competition.where(results_posted_at: nil).select { |c| nag_needed(c) }.each do |competition|
      competition.update_attribute(:results_nag_sent_at, Time.now)
      CompetitionsMailer.submit_results_nag(competition).deliver_now
    end
  end
end
