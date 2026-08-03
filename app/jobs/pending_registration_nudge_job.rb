# frozen_string_literal: true

class PendingRegistrationNudgeJob < ApplicationJob
  def should_nudge_registration(registration)
    registration.created_at < 3.days.ago
  end

  def perform(competition_id)
    competition = Competition.find(competition_id)

    nudged = []

    competition.registrations.pending.each do |registration|
      next unless should_nudge_registration(registration)

      # Newcomers get a gentler wording, so check whether they have competed before.
      newcomer = !Result.exists?(person_id: registration.user.wca_id)

      registration.update(nudge_sent_at: Time.now)
      RegistrationsMailer.pending_nudge(registration, newcomer).deliver_later

      nudged << registration
    end

    nudged.sort_by!(&:registrant_id)

    competition.update(last_nudge_count: nudged.length)
  end
end
