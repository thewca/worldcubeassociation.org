# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RegistrationReminderJob, type: :job do
  describe "registration reminder job" do
    let(:user) { FactoryBot.create :user }
    let(:delegate) { FactoryBot.create :delegate }
    let(:organizers) { FactoryBot.create_list :user, 3 }
    let(:competition) { FactoryBot.create :competition, :visible, organizers: organizers, delegates: [delegate] }

    it "does not send more than 24h in advance" do
      competition.registration_open = 2.days.from_now

      expect do
        RegistrationReminderJob.perform_now
      end.to change { enqueued_jobs.size }.by(0)
    end

    it "schedules registration reminder emails" do
      BookmarkedCompetition.create(competition: competition, user: user)
      competition.update_column(:registration_open, 12.hours.from_now)

      expect(CompetitionsMailer).to receive(:registration_reminder).with(competition, user, false).and_call_original
      expect(CompetitionsMailer).to receive(:registration_reminder).with(competition, delegate, false).and_call_original
      organizers.each do |organizer|
        expect(CompetitionsMailer).to receive(:registration_reminder).with(competition, organizer, false).and_call_original
      end

      expect do
        RegistrationReminderJob.perform_now
      end.to change { enqueued_jobs.size }.by(5)

      # Running the job again won't send any more emails.
      expect do
        RegistrationReminderJob.perform_now
      end.to change { enqueued_jobs.size }.by(0)
    end

    it "resends when registration period changes" do
      BookmarkedCompetition.create(competition: competition, user: user)
      competition.update_column(:registration_reminder_sent_at, 7.days.ago)
      competition.update_column(:registration_open, 12.hours.from_now)

      expect(CompetitionsMailer).to receive(:registration_reminder).with(competition, user, false).and_call_original
      expect(CompetitionsMailer).to receive(:registration_reminder).with(competition, delegate, false).and_call_original
      organizers.each do |organizer|
        expect(CompetitionsMailer).to receive(:registration_reminder).with(competition, organizer, false).and_call_original
      end

      expect do
        RegistrationReminderJob.perform_now
      end.to change { enqueued_jobs.size }.by(5)
    end

    it "does not send to registered and accepted users" do
      BookmarkedCompetition.create(competition: competition, user: user)
      FactoryBot.create(:registration, :accepted, competition: competition, user: user)
      FactoryBot.create(:registration, :pending, competition: competition, user: delegate)
      competition.update_column(:registration_open, 12.hours.from_now)

      expect(CompetitionsMailer).to receive(:registration_reminder).with(competition, delegate, true).and_call_original
      organizers.each do |organizer|
        expect(CompetitionsMailer).to receive(:registration_reminder).with(competition, organizer, false).and_call_original
      end

      expect do
        RegistrationReminderJob.perform_now
      end.to change { enqueued_jobs.size }.by(4)
    end
  end
end
