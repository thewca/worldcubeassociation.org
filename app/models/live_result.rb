# frozen_string_literal: true

class LiveResult < ApplicationRecord
  has_many :live_attempts, dependent: :destroy

  after_create :notify_users
  after_update :notify_users

  belongs_to :registration

  belongs_to :entered_by, class_name: 'User', foreign_key: 'entered_by_id'

  belongs_to :round

  def serializable_hash(options = nil)
    {
      attempts: live_attempts.as_json,
      registration_id: registration_id,
      result_id: id,
      best: best,
      average: average,
      single_record_tag: single_record_tag,
      average_record_tag: average_record_tag,
      advancing: advancing,
      advancing_questionable: advancing_questionable,
    }
  end

  private

    def notify_users
      ActionCable.server.broadcast("results_#{round_id}", serializable_hash)
    end
end
