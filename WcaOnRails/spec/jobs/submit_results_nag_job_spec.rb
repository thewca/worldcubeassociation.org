require 'rails_helper'

RSpec.describe SubmitResultsNagJob, type: :job do
  it "schedules results nag email" do
    recent_competition_missing_results = FactoryGirl.create :competition, starts: 3.days.ago
    old_competition_missing_results = FactoryGirl.create :competition, starts: 3.weeks.ago
    older_competition_missing_results_but_already_nagged = FactoryGirl.create :competition, starts: 3.weeks.ago, results_nag_sent_at: 1.day.ago
    older_competition_missing_results_nagged_a_long_time_ago = FactoryGirl.create :competition, starts: 3.weeks.ago, results_nag_sent_at: 8.days.ago

    expect(CompetitionsMailer).to receive(:submit_results_nag).with(old_competition_missing_results).and_call_original
    expect(CompetitionsMailer).to receive(:submit_results_nag).with(older_competition_missing_results_nagged_a_long_time_ago).and_call_original
    SubmitResultsNagJob.perform_now
    assert_enqueued_jobs 2

    # Calling SubmitResultsNagJob again shouldn't cause any new emails to be sent.
    SubmitResultsNagJob.perform_now
    assert_enqueued_jobs 2
  end
end
