# frozen_string_literal: true

require "rails_helper"

RSpec.describe DelegateStatusChangeMailer, type: :mailer do
  describe "notify_board_and_assistants_of_delegate_status_change" do
    let(:senior_delegate_role1) { FactoryBot.create :senior_delegate_role }
    let(:senior_delegate_role2) { FactoryBot.create :senior_delegate_role }
    let(:delegate) { FactoryBot.create :delegate, name: "Daenerys Targaryen", delegate_status: "candidate_delegate", region_id: senior_delegate_role1.group.id }
    let(:user) { FactoryBot.create :user, name: "Jon Snow" }

    it "email headers are correct" do
      user.update!(delegate_status: "candidate_delegate", region_id: senior_delegate_role1.group.id)
      mail = DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(user, senior_delegate_role1.user, senior_delegate_role1.user, nil, "candidate_delegate")

      expect(mail.subject).to eq("#{senior_delegate_role1.user.name} just changed the Delegate status of Jon Snow")
      expect(mail.to).to eq(["board@worldcubeassociation.org"])
      expect(mail.cc).to eq(["assistants@worldcubeassociation.org", "finance@worldcubeassociation.org", senior_delegate_role1.user.email, senior_delegate_role1.user.email])
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
      expect(mail.reply_to).to eq([senior_delegate_role1.user.email])
    end

    it "promoting a registered speedcuber to a delegate" do
      user.update!(delegate_status: "candidate_delegate", region_id: senior_delegate_role1.group.id)
      mail = DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(user, senior_delegate_role1.user, senior_delegate_role1.user, nil, "candidate_delegate")

      expect(CGI.unescapeHTML(mail.body.encoded)).to match("#{senior_delegate_role1.user.name} has changed the Delegate status of Jon Snow from Registered Speedcuber to Junior Delegate.")
      expect(CGI.unescapeHTML(mail.body.encoded)).not_to match("Warning")
      expect(CGI.unescapeHTML(mail.body.encoded)).to match(edit_user_url(user))
    end

    it "promoting a Junior delegate to a delegate" do
      delegate.update!(delegate_status: "delegate")
      mail = DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(delegate, senior_delegate_role1.user, senior_delegate_role1.user, "candidate_delegate", "delegate")

      expect(CGI.unescapeHTML(mail.body.encoded)).to match("#{senior_delegate_role1.user.name} has changed the Delegate status of Daenerys Targaryen from Junior Delegate to Delegate.")
      expect(CGI.unescapeHTML(mail.body.encoded)).not_to match("Warning")
      expect(CGI.unescapeHTML(mail.body.encoded)).to match(edit_user_url(delegate))
    end

    it "demoting a Junior delegate to a registered speedcuber" do
      delegate.update!(delegate_status: nil, region_id: nil)
      mail = DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(delegate, senior_delegate_role1.user, senior_delegate_role1.user, "candidate_delegate", nil)

      expect(CGI.unescapeHTML(mail.body.encoded)).to match("#{senior_delegate_role1.user.name} has changed the Delegate status of Daenerys Targaryen from Junior Delegate to Registered Speedcuber.")
      expect(CGI.unescapeHTML(mail.body.encoded)).not_to match("Warning")
      expect(CGI.unescapeHTML(mail.body.encoded)).to match(edit_user_url(delegate))
    end

    it "renders a warning if someone other than their senior delegate makes the change" do
      delegate.update!(delegate_status: "delegate")
      mail = DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(delegate, senior_delegate_role2.user, senior_delegate_role1.user, "candidate_delegate", "delegate")

      expect(CGI.unescapeHTML(mail.body.encoded)).to match("Warning: #{senior_delegate_role2.user.name} is not Daenerys Targaryen's Senior Delegate.")
    end
  end
end
