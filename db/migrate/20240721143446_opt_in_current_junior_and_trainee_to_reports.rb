# frozen_string_literal: true

class OptInCurrentJuniorAndTraineeToReports < ActiveRecord::Migration[7.1]
  def change
    User.joins(:delegate_role_metadata)
        .merge(RolesMetadataDelegateRegions.junior_delegate.or(RolesMetadataDelegateRegions.trainee_delegate))
        .update_all(receive_delegate_reports: true)
  end
end
