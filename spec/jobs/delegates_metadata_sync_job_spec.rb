# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DelegatesMetadataSyncJob do
  describe "delegates metadata sync job" do
    let(:delegate) { create(:delegate_role) }
    let(:delegate2) { create(:delegate_role) }
    let(:competition1) { create(:competition, :visible, delegates: [delegate.user, delegate2.user], start_date: 4.weeks.ago, end_date: 4.weeks.ago + 2.days, lead_delegate_id: delegate2.user.id) }
    let(:competition2) { create(:competition, :past, :visible, delegates: [delegate.user, delegate2.user], start_date: 2.weeks.ago, end_date: 2.weeks.ago + 3.days, lead_delegate_id: delegate.user.id) }

    it "syncs successfully" do
      competition1.delegates.reload
      competition2.delegates.reload
      DelegatesMetadataSyncJob.perform_now
      expect(UserRole.find(delegate.id).metadata.first_delegated).to eq(competition1.start_date)
      expect(UserRole.find(delegate.id).metadata.last_delegated).to eq(competition2.start_date)
      expect(UserRole.find(delegate.id).metadata.total_delegated).to eq(2)
      expect(UserRole.find(delegate.id).metadata.lead_delegated_competitions).to eq(1)
    end
  end
end
