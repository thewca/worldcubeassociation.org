# frozen_string_literal: true

require "rails_helper"

RSpec.describe RoleChangeMailer do
  describe 'notify_role_start for delegate probation' do
    let(:user_who_made_the_change) { create(:user) }
    let(:senior_delegate) { create(:senior_delegate_role) }
    let(:delegate) { create(:delegate_role, group: senior_delegate.group) }
    let(:role) { create(:probation_role, user: delegate.user) }
    let(:mail) { described_class.notify_role_start(role, user_who_made_the_change) }

    it 'renders the headers' do
      expect(mail.to).to match_array [user_who_made_the_change.email, GroupsMetadataBoard.email, senior_delegate.user.email, UserGroup.teams_committees_group_wrt.metadata.email, UserGroup.teams_committees_group_wic.email,
                                      UserGroup.teams_committees_group_weat.email].flatten
      expect(mail.reply_to).to contain_exactly(user_who_made_the_change.email)
      expect(mail.subject).to eq "New role added for #{role.user.name} in Delegate Probation"
    end

    it 'renders the body' do
      expect(CGI.unescapeHTML(mail.body.encoded)).to match role.user.name
      expect(CGI.unescapeHTML(mail.body.encoded)).to match user_who_made_the_change.name
    end
  end

  describe 'notify_role_start where senior_delegate and user_who_made_the_change are same' do
    let(:senior_delegate) { create(:senior_delegate_role) }
    let(:delegate) { create(:delegate_role, group: senior_delegate.group) }
    let(:role) { create(:probation_role, user: delegate.user) }
    let(:mail) { described_class.notify_role_start(role, senior_delegate.user) }

    it 'renders the headers' do
      expect(mail.to).to contain_exactly(GroupsMetadataBoard.email, senior_delegate.user.email, UserGroup.teams_committees_group_wrt.metadata.email, UserGroup.teams_committees_group_wic.metadata.email,
                                         UserGroup.teams_committees_group_weat.metadata.email)
      expect(mail.reply_to).to contain_exactly(senior_delegate.user.email)
      expect(mail.subject).to eq "New role added for #{role.user.name} in Delegate Probation"
    end

    it 'renders the body' do
      expect(CGI.unescapeHTML(mail.body.encoded)).to match role.user.name
      expect(CGI.unescapeHTML(mail.body.encoded)).to match senior_delegate.user.name
    end
  end

  describe 'notify_role_change for delegate probation' do
    let(:user_who_made_the_change) { create(:user) }
    let(:senior_delegate) { create(:senior_delegate_role) }
    let(:delegate) { create(:delegate_role, group: senior_delegate.group) }
    let(:role) { create(:probation_role, user: delegate.user) }
    let(:mail) { described_class.notify_role_change(role, user_who_made_the_change, [UserRole::UserRoleChange.new(changed_parameter: 'End Date', previous_value: 'Empty', new_value: '01-01-2024')].to_json) }

    it 'renders the headers' do
      expect(mail.to).to match_array [user_who_made_the_change.email, GroupsMetadataBoard.email, senior_delegate.user.email, UserGroup.teams_committees_group_wrt.metadata.email, UserGroup.teams_committees_group_wic.metadata.email,
                                      UserGroup.teams_committees_group_weat.metadata.email].flatten
      expect(mail.reply_to).to contain_exactly(user_who_made_the_change.email)
      expect(mail.subject).to eq "Role changed for #{role.user.name} in Delegate Probation"
    end

    it 'renders the body' do
      expect(CGI.unescapeHTML(mail.body.encoded)).to match role.user.name
      expect(CGI.unescapeHTML(mail.body.encoded)).to match user_who_made_the_change.name
    end
  end

  describe 'notify_role_end' do
    let(:translator) { create(:regional_delegate_role) }
    let(:user_who_made_the_change) { create(:user, name: 'Sherlock Holmes') }
    let(:mail) { described_class.notify_role_end(translator, user_who_made_the_change) }

    it 'renders the headers' do
      expect(mail.to).to contain_exactly(user_who_made_the_change.email, GroupsMetadataBoard.email, UserGroup.teams_committees_group_weat.metadata.email, UserGroup.teams_committees_group_wfc.metadata.email,
                                         UserGroup.teams_committees_group_wrt.metadata.email)
      expect(mail.reply_to).to contain_exactly(user_who_made_the_change.email)
      expect(mail.subject).to eq "Role removed for #{translator.user.name} in Delegate Regions"
    end

    it 'renders the body' do
      expect(CGI.unescapeHTML(mail.body.encoded)).to match translator.user.name
      expect(CGI.unescapeHTML(mail.body.encoded)).to match user_who_made_the_change.name
    end
  end
end
