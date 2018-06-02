# frozen_string_literal: true

require "rails_helper"

RSpec.describe DelegateStatusChangeMailer, type: :mailer do
  describe "notify_board_and_wqac_of_delegate_status_change" do
    let(:senior_delegate1) { FactoryBot.create :senior_delegate }
    let(:senior_delegate2) { FactoryBot.create :senior_delegate }
    let(:delegate) { FactoryBot.create :delegate, delegate_status: "candidate_delegate", senior_delegate: senior_delegate1 }
    let(:user) { FactoryBot.create :user }

    it "email headers are correct" do
      user.update!(delegate_status: "candidate_delegate", senior_delegate: senior_delegate1)
      mail = DelegateStatusChangeMailer.notify_board_and_wqac_of_delegate_status_change(user, senior_delegate1)

      expect(mail.subject).to eq("#{senior_delegate1.name} just changed the Delegate status of #{user.name}")
      expect(mail.to).to eq(["board@worldcubeassociation.org"])
      expect(mail.cc).to eq(["quality@worldcubeassociation.org", senior_delegate1.email, senior_delegate1.email])
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
      expect(mail.reply_to).to eq([senior_delegate1.email])
    end

    it "promoting a registered speedcuber to a delegate" do
      user.update!(delegate_status: "candidate_delegate", senior_delegate: senior_delegate1)
      mail = DelegateStatusChangeMailer.notify_board_and_wqac_of_delegate_status_change(user, senior_delegate1)

      expect(mail.body.encoded).to match("#{senior_delegate1.name} has changed the Delegate status of #{user.name} from Registered Speedcuber to Candidate Delegate.")
      expect(mail.body.encoded).not_to match("Warning")
      expect(mail.body.encoded).to match(edit_user_url(user))
    end

    # TODO: This test can get removed once we require delegates to have senior delegates: https://github.com/thewca/worldcubeassociation.org/issues/2933
    it "promoting a registered speedcuber to a delegate without setting a senior delegate" do
      user.update!(delegate_status: "candidate_delegate")
      mail = DelegateStatusChangeMailer.notify_board_and_wqac_of_delegate_status_change(user, senior_delegate1)

      expect(mail.cc).to eq(["quality@worldcubeassociation.org", senior_delegate1.email])
      expect(mail.body.encoded).to match("Warning: #{senior_delegate1.name} forgot to assign a Senior Delegate to #{user.name}")
      expect(mail.body.encoded).to match(edit_user_url(user))
    end

    it "promoting a candidate delegate to a delegate" do
      delegate.update!(delegate_status: "delegate")
      mail = DelegateStatusChangeMailer.notify_board_and_wqac_of_delegate_status_change(delegate, senior_delegate1)

      expect(mail.body.encoded).to match("#{senior_delegate1.name} has changed the Delegate status of #{delegate.name} from Candidate Delegate to Delegate.")
      expect(mail.body.encoded).not_to match("Warning")
      expect(mail.body.encoded).to match(edit_user_url(delegate))
    end

    it "demoting a candidate delegate to a registered speedcuber" do
      delegate.update!(delegate_status: nil, senior_delegate: nil)
      mail = DelegateStatusChangeMailer.notify_board_and_wqac_of_delegate_status_change(delegate, senior_delegate1)

      expect(mail.body.encoded).to match("#{senior_delegate1.name} has changed the Delegate status of #{delegate.name} from Candidate Delegate to Registered Speedcuber.")
      expect(mail.body.encoded).not_to match("Warning")
      expect(mail.body.encoded).to match(edit_user_url(delegate))
    end

    it "renders a warning if someone other than their senior delegate makes the change" do
      delegate.update!(delegate_status: "delegate")
      mail = DelegateStatusChangeMailer.notify_board_and_wqac_of_delegate_status_change(delegate, senior_delegate2)

      expect(mail.body.encoded).to match("Warning: #{senior_delegate2.name} is not #{delegate.name}'s Senior Delegate.")
    end
  end
end
