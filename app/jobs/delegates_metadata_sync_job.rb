# frozen_string_literal: true

class DelegatesMetadataSyncJob < WcaCronjob
  def perform
    UserGroup.delegate_regions.flat_map(&:roles).map do |role|
      next if role.lead?

      user = role.user
      role.metadata.first_delegated = user.actually_delegated_competitions.to_a.minimum(:start_date)
      role.metadata.last_delegated = user.actually_delegated_competitions.to_a.maximum(:start_date)
      role.metadata.total_delegated = user.actually_delegated_competitions.to_a.length
      role.metadata.lead_delegated_competitions = user.actually_delegated_competitions.to_a.count { |c| c.lead_delegate_id == user.id }
      role.metadata.save!
    end
  end
end
