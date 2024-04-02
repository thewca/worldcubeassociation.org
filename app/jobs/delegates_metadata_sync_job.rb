# frozen_string_literal: true

class DelegatesMetadataSyncJob < WcaCronjob
  def perform
    UserGroup.delegate_regions.flat_map(&:roles).map do |role|
      unless role.is_lead?
        user = role.user
        first_delegated = user.actually_delegated_competitions.to_a.minimum(:start_date)
        last_delegated = user.actually_delegated_competitions.to_a.maximum(:start_date)
        total_delegated = user.actually_delegated_competitions.to_a.length
        role.metadata.first_delegated = first_delegated
        role.metadata.last_delegated = last_delegated
        role.metadata.total_delegated = total_delegated
        role.metadata.save!
      end
    end
  end
end
