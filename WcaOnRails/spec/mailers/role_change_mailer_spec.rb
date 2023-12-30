# frozen_string_literal: true

require "rails_helper"

RSpec.describe RoleChangeMailer, type: :mailer do
  describe 'notify_role_start' do
    let(:africa_region) { FactoryBot.create(:africa_region) }
    let(:senior_delegate) { FactoryBot.create(:senior_delegate, region_id: africa_region.id) }
    let(:role) { FactoryBot.create(:probation_role, user: FactoryBot.create(:senior_delegate, region_id: africa_region.id)) }
    let(:user_who_made_the_change) { FactoryBot.create(:user, name: 'Sherlock Holmes') }
    let(:mail) { described_class.notify_role_start(role, user_who_made_the_change) }

    it 'renders the headers' do
      expect(mail.to).to eq [user_who_made_the_change.email, Team.board.email, role.user.senior_delegate.email]
      expect(mail.reply_to).to eq [user_who_made_the_change.email]
      expect(mail.subject).to eq "New role added for #{role.user.name} in Delegate Probation"
    end

    it 'renders the body' do
      role.reload
      role.user.senior_delegate.reload
      expect(mail.body.encoded).to match role.user.name
      expect(mail.body.encoded).to match user_who_made_the_change.name
    end
  end

  describe 'notify_change_probation_end_date' do
    let(:africa_region) { FactoryBot.create(:africa_region) }
    let(:senior_delegate) { FactoryBot.create(:senior_delegate, region_id: africa_region.id) }
    let(:role) { FactoryBot.create(:probation_role, user: FactoryBot.create(:senior_delegate, region_id: africa_region.id)) }
    let(:user_who_made_the_change) { FactoryBot.create(:user, name: 'Sherlock Holmes') }
    let(:mail) { described_class.notify_change_probation_end_date(role, user_who_made_the_change) }

    it 'renders the headers' do
      role.reload
      role.user.senior_delegate.reload
      expect(mail.to).to eq [user_who_made_the_change.email, Team.board.email, role.user.senior_delegate.email]
      expect(mail.reply_to).to eq [user_who_made_the_change.email]
      expect(mail.subject).to eq "Delegate Probation end date changed for #{role.user.name}"
    end

    it 'renders the body' do
      role.reload
      role.user.senior_delegate.reload
      expect(mail.body.encoded).to match role.user.name
      expect(mail.body.encoded).to match user_who_made_the_change.name
    end
  end
end
