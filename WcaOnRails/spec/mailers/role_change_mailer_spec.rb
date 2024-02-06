# frozen_string_literal: true

require "rails_helper"

RSpec.describe RoleChangeMailer, type: :mailer do
  describe 'notify_role_start for delegate probation' do
    let(:user_who_made_the_change) { FactoryBot.create(:user) }
    let(:delegate_region_americas) { FactoryBot.create(:delegate_region_americas) }
    let(:senior_delegate) { FactoryBot.create(:senior_delegate, region_id: delegate_region_americas.id) }
    let(:delegate) { FactoryBot.create(:delegate, region_id: delegate_region_americas.id) }
    let(:role) { FactoryBot.create(:probation_role, user: delegate) }
    let(:mail) { described_class.notify_role_start(role, user_who_made_the_change) }

    it 'renders the headers' do
      senior_delegate.reload
      expect(mail.to).to match_array [user_who_made_the_change.email, Team.board.email, senior_delegate.email].flatten
      expect(mail.reply_to).to match_array [user_who_made_the_change.email]
      expect(mail.subject).to eq "New role added for #{role.user.name} in Delegate Probation"
    end

    it 'renders the body' do
      senior_delegate.reload
      expect(CGI.unescapeHTML(mail.body.encoded)).to match role.user.name
      expect(CGI.unescapeHTML(mail.body.encoded)).to match user_who_made_the_change.name
    end
  end

  describe 'notify_role_start where senior_delegate and user_who_made_the_change are same' do
    let(:delegate_region_americas) { FactoryBot.create(:delegate_region_americas) }
    let(:senior_delegate) { FactoryBot.create(:senior_delegate, region_id: delegate_region_americas.id) }
    let(:delegate) { FactoryBot.create(:delegate, region_id: delegate_region_americas.id) }
    let(:role) { FactoryBot.create(:probation_role, user: delegate) }
    let(:mail) { described_class.notify_role_start(role, senior_delegate) }

    it 'renders the headers' do
      expect(mail.to).to match_array [Team.board.email, senior_delegate.email]
      expect(mail.reply_to).to match_array [senior_delegate.email]
      expect(mail.subject).to eq "New role added for #{role.user.name} in Delegate Probation"
    end

    it 'renders the body' do
      senior_delegate.reload
      expect(mail.body.encoded).to match role.user.name
      expect(mail.body.encoded).to match senior_delegate.name
    end
  end

  describe 'notify_change_probation_end_date' do
    let(:user_who_made_the_change) { FactoryBot.create(:user) }
    let(:delegate_region_americas) { FactoryBot.create(:delegate_region_americas) }
    let(:senior_delegate) { FactoryBot.create(:senior_delegate, region_id: delegate_region_americas.id) }
    let(:delegate) { FactoryBot.create(:delegate, region_id: delegate_region_americas.id) }
    let(:role) { FactoryBot.create(:probation_role, user: delegate) }
    let(:mail) { described_class.notify_change_probation_end_date(role, user_who_made_the_change) }

    it 'renders the headers' do
      senior_delegate.reload
      expect(mail.to).to match_array [user_who_made_the_change.email, Team.board.email, senior_delegate.email].flatten
      expect(mail.reply_to).to match_array [user_who_made_the_change.email]
      expect(mail.subject).to eq "Delegate Probation end date changed for #{role.user.name}"
    end

    it 'renders the body' do
      senior_delegate.reload
      expect(CGI.unescapeHTML(mail.body.encoded)).to match role.user.name
      expect(CGI.unescapeHTML(mail.body.encoded)).to match user_who_made_the_change.name
    end
  end

  describe 'notify_role_end' do
    let(:translator) { FactoryBot.create :regional_delegate_role }
    let(:user_who_made_the_change) { FactoryBot.create(:user, name: 'Sherlock Holmes') }
    let(:mail) { described_class.notify_role_end(translator, user_who_made_the_change) }

    it 'renders the headers' do
      expect(mail.to).to match_array [user_who_made_the_change.email, Team.board.email, Team.weat.email, Team.wfc.email]
      expect(mail.reply_to).to match_array [user_who_made_the_change.email]
      expect(mail.subject).to eq "Role removed for #{translator.user.name} in Delegate Regions"
    end

    it 'renders the body' do
      expect(CGI.unescapeHTML(mail.body.encoded)).to match translator.user.name
      expect(CGI.unescapeHTML(mail.body.encoded)).to match user_who_made_the_change.name
    end
  end
end
