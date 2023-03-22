# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SubmitReportNagJob, type: :job do
  it "schedules report nag email" do
    _unscheduled_competition = FactoryBot.create :competition, starts: nil
    _recent_competition_missing_report = FactoryBot.create :competition, :visible, starts: 3.days.ago
    old_competition_missing_report = FactoryBot.create :competition, :visible, starts: 3.weeks.ago
    _very_old_competition_missing_report = FactoryBot.create :competition, :visible, starts: (DelegateReport::REPORTS_ENABLED_DATE - 1.year)
    _older_competition_missing_report_but_already_nagged = FactoryBot.create(:competition, :visible, starts: 3.weeks.ago).tap do |competition|
      competition.delegate_report.update(nag_sent_at: 1.day.ago)
    end
    older_competition_missing_report_nagged_a_long_time_ago = FactoryBot.create(:competition, :visible, starts: 3.weeks.ago).tap do |competition|
      competition.delegate_report.update(nag_sent_at: 8.days.ago)
    end

    expect(CompetitionsMailer).to receive(:submit_report_nag).with(old_competition_missing_report).and_call_original
    expect(CompetitionsMailer).to receive(:submit_report_nag).with(older_competition_missing_report_nagged_a_long_time_ago).and_call_original

    expect do
      SubmitReportNagJob.perform_now
    end.to change { ActionMailer::Base.deliveries.length }.by(2)

    # Calling SubmitReportNagJob again shouldn't cause any new emails to be sent.
    expect do
      SubmitReportNagJob.perform_now
    end.to change { ActionMailer::Base.deliveries.length }.by(0)
  end

  it "schedules report reminder email" do
    _unscheduled_competition = FactoryBot.create :competition, starts: nil
    _recent_competition_missing_report = FactoryBot.create :competition, :visible, starts: 3.days.ago
    old_competition_missing_report = FactoryBot.create :competition, :visible, starts: 6.days.ago
    _very_old_competition_missing_report = FactoryBot.create :competition, :visible, starts: (DelegateReport::REPORTS_ENABLED_DATE - 1.year)
    _older_competition_missing_report_but_already_reminded = FactoryBot.create(:competition, :visible, starts: 6.days.ago).tap do |competition|
      competition.delegate_report.update(reminder_sent_at: 1.day.ago)
    end

    expect(CompetitionsMailer).to receive(:submit_report_reminder).with(old_competition_missing_report).and_call_original

    expect do
      SubmitReportNagJob.perform_now
    end.to change { ActionMailer::Base.deliveries.length }.by(1)

    # Calling SubmitReportNagJob again shouldn't cause any new emails to be sent.
    expect do
      SubmitReportNagJob.perform_now
    end.to change { ActionMailer::Base.deliveries.length }.by(0)
  end
end
