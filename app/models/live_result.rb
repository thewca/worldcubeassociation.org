# frozen_string_literal: true

class LiveResult < ApplicationRecord
  has_many :live_attempts, dependent: :destroy

  after_create :notify_users
  after_update :notify_users

  belongs_to :person, class_name: 'User', foreign_key: 'person_id'

  belongs_to :entered_by, class_name: 'User', foreign_key: 'entered_by_id'

  belongs_to :round

  private

    def notify_users
      ActionCable.server.broadcast("results_#{round_id}",
                                   { attempts: live_attempts.as_json, user_id: person_id, result_id: id })
    end
end
