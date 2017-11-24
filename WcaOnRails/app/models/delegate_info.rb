# frozen_string_literal: true

require "fileutils"

class DelegateInfo < ApplicationRecord
  self.table_name = "delegates"

  has_many :subordinate_delegates, class_name: "User", foreign_key: "senior_delegate_id"
  belongs_to :senior_delegate, -> { where(delegate_status: "senior_delegate").order(:name) }, class_name: "User"

  validate :cannot_demote_senior_delegate_with_subordinate_delegates
  def cannot_demote_senior_delegate_with_subordinate_delegates
    #if delegate_status_was == "senior_delegate" && delegate_status != "senior_delegate" && !subordinate_delegates.empty?
    if delegate.status_was == "senior_delegate" && delegate.status != "senior_delegate" && !subordinate_delegates.empty?
      errors.add(:delegate_status, I18n.t('users.errors.senior_has_delegate'))
    end
  end

  validate :senior_delegate_must_be_senior_delegate
  def senior_delegate_must_be_senior_delegate
    if senior_delegate && !senior_delegate.senior_delegate?
      errors.add(:senior_delegate, I18n.t('users.errors.must_be_senior'))
    end
  end

  validate :senior_delegate_presence
  def senior_delegate_presence
    if !User.delegate_status_allows_senior_delegate(delegate_status) && senior_delegate
      errors.add(:senior_delegate, I18n.t('users.errors.must_not_be_present'))
    end
  end

  def self.delegate_status_allows_senior_delegate(delegate_status)
    {
      nil => false,
      "" => false,
      "candidate_delegate" => true,
      "delegate" => true,
      "senior_delegate" => false,
      "board_member" => false,
    }.fetch(delegate_status)
  end

  # This needs to be changed, since Board Members (or Directors) are not necessarily delegates.
  validate :not_illegally_demoting_oneself
  def not_illegally_demoting_oneself
    about_to_lose_access = !board_member?
    if current_user == self && about_to_lose_access
      if delegate_status_was == "board_member"
        errors.add(:delegate_status, I18n.t('users.errors.board_member_cannot_resign'))
      end
    end
  end

  after_save :remove_pending_wca_id_claims
  private def remove_pending_wca_id_claims
    if saved_change_to_delegate_status? && !delegate_status
      users_claiming_wca_id.each do |user|
        user.update delegate_id_to_handle_wca_id_claim: nil, unconfirmed_wca_id: nil
        senior_delegate = User.find_by_id(senior_delegate_id_before_last_save)
        WcaIdClaimMailer.notify_user_of_delegate_demotion(user, self, senior_delegate).deliver_later
      end
    end
  end
end
