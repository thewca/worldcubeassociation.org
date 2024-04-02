# frozen_string_literal: true

class DelegatesMetadataSyncJob < WcaCronjob
  def perform
    UserGroup.delegate_regions.flat_map(&:roles).map do |role|
      unless role.is_lead?
        user = role.user
        first_delegated = user.actually_delegated_competitions.to_a.minimum(:start_date)
        last_delegated = user.actually_delegated_competitions.to_a.maximum(:start_date)
        total_delegated = user.actually_delegated_competitions.to_a.length
        if role.metadata.first_delegated != first_delegated
          role.metadata.update!(first_delegated: first_delegated)
        end
        if role.metadata.last_delegated != last_delegated
          role.metadata.update!(last_delegated: last_delegated)
        end
        if role.metadata.total_delegated != total_delegated
          role.metadata.update!(total_delegated: total_delegated)
        end
      end
    end
  end
end
