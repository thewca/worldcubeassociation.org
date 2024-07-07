# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DelegatesMetadataSyncJob, type: :job do
  describe 'delegates metadata sync job' do
    let(:delegate) { FactoryBot.create :delegate_role }
    let(:competition1) { FactoryBot.create :competition, :visible, delegates: [delegate.user], start_date: 4.weeks.ago, end_date: 4.weeks.ago + 2.days }
    let(:competition2) { FactoryBot.create :competition, :past, :visible, delegates: [delegate.user], start_date: 2.weeks.ago, end_date: 2.week.ago + 3.days }

    it 'syncs successfully' do
      competition1.delegates.reload
      competition2.delegates.reload
      DelegatesMetadataSyncJob.perform_now
      expect(UserRole.find(delegate.id).metadata.first_delegated).to eq(competition1.start_date)
      expect(UserRole.find(delegate.id).metadata.last_delegated).to eq(competition2.start_date)
      expect(UserRole.find(delegate.id).metadata.total_delegated).to eq(2)
    end
  end
end
