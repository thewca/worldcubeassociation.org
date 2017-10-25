# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SubmitResultsNagJob, type: :job do
  it "schedules results nag email" do
    _unscheduled_competition = FactoryBot.create :competition, starts: nil
    _recent_competition_missing_results = FactoryBot.create :competition, :visible, starts: 3.days.ago
    old_competition_missing_results = FactoryBot.create :competition, :visible, starts: 3.weeks.ago
    _older_competition_missing_results_but_already_nagged = FactoryBot.create :competition, :visible, starts: 3.weeks.ago, results_nag_sent_at: 1.day.ago
    older_competition_missing_results_nagged_a_long_time_ago = FactoryBot.create :competition, :visible, starts: 3.weeks.ago, results_nag_sent_at: 8.days.ago

    expect(CompetitionsMailer).to receive(:submit_results_nag).with(old_competition_missing_results).and_call_original
    expect(CompetitionsMailer).to receive(:submit_results_nag).with(older_competition_missing_results_nagged_a_long_time_ago).and_call_original

    expect do
      SubmitResultsNagJob.perform_now
    end.to change { ActionMailer::Base.deliveries.length }.by(2)

    # Calling SubmitResultsNagJob again shouldn't cause any new emails to be sent.
    expect do
      SubmitResultsNagJob.perform_now
    end.to change { ActionMailer::Base.deliveries.length }.by(0)
  end
end
