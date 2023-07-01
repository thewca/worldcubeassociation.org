# frozen_string_literal: true

class RegistrationReminderJob < ApplicationJob
  include SingletonApplicationJob

  queue_as :default

  def should_send_reminder(competition)
    # We send a reminder if we haven't sent a reminder before, or if we sent one more than 2 days ago (i.e. if there is a second registration period).
    competition.registration_reminder_sent_at.nil? || competition.registration_reminder_sent_at < 2.days.ago
  end

  def perform
    Competition
      .visible
      .not_cancelled
      .where("registration_open <= ? AND registration_open >= NOW()", 1.day.from_now)
      .includes(bookmarked_competitions: [:user])
      .select { |c| should_send_reminder(c) }.each do |competition|
        ActiveRecord::Base.transaction do
          competition.update_attribute(:registration_reminder_sent_at, Time.now)
          users_to_email = competition.bookmarked_users
          users_to_email.concat(competition.managers)
          registered_users = competition.registrations.accepted.pluck(:user_id)
          pending_registered_users = competition.registrations.pending.pluck(:user_id)
          users_to_email.select { |user| !registered_users.include?(user.id) }.uniq.each do |user|
            CompetitionsMailer.registration_reminder(competition, user, pending_registered_users.include?(user.id)).deliver_later
          end
        end
      end
  end
end
