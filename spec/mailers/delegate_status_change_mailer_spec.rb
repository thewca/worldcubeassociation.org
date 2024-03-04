# frozen_string_literal: true

require "rails_helper"

RSpec.describe DelegateStatusChangeMailer, type: :mailer do
  describe "notify_board_and_assistants_of_delegate_status_change" do
    let(:senior_delegate1) { FactoryBot.create :senior_delegate, name: "Eddard Stark" }
    let(:senior_delegate2) { FactoryBot.create :senior_delegate, name: "Catelyn Stark" }
    let(:delegate) { FactoryBot.create :delegate, name: "Daenerys Targaryen", delegate_status: "candidate_delegate", region_id: senior_delegate1.region_id }
    let(:user) { FactoryBot.create :user, name: "Jon Snow" }

    it "email headers are correct" do
      user.update!(delegate_status: "candidate_delegate", region_id: senior_delegate1.region_id)
      mail = DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(user, senior_delegate1, senior_delegate1, nil, "candidate_delegate")

      expect(mail.subject).to eq("Eddard Stark just changed the Delegate status of Jon Snow")
      expect(mail.to).to eq(["board@worldcubeassociation.org"])
      expect(mail.cc).to eq(["assistants@worldcubeassociation.org", "finance@worldcubeassociation.org", senior_delegate1.email, senior_delegate1.email])
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
      expect(mail.reply_to).to eq([senior_delegate1.email])
    end

    it "promoting a registered speedcuber to a delegate" do
      user.update!(delegate_status: "candidate_delegate", region_id: senior_delegate1.region_id)
      mail = DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(user, senior_delegate1, senior_delegate1, nil, "candidate_delegate")

      expect(mail.body.encoded).to match("Eddard Stark has changed the Delegate status of Jon Snow from Registered Speedcuber to Junior Delegate.")
      expect(mail.body.encoded).not_to match("Warning")
      expect(mail.body.encoded).to match(edit_user_url(user))
    end

    it "promoting a Junior delegate to a delegate" do
      delegate.update!(delegate_status: "delegate")
      mail = DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(delegate, senior_delegate1, senior_delegate1, "candidate_delegate", "delegate")

      expect(mail.body.encoded).to match("Eddard Stark has changed the Delegate status of Daenerys Targaryen from Junior Delegate to Delegate.")
      expect(mail.body.encoded).not_to match("Warning")
      expect(mail.body.encoded).to match(edit_user_url(delegate))
    end

    it "demoting a Junior delegate to a registered speedcuber" do
      delegate.update!(delegate_status: nil, region_id: nil)
      mail = DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(delegate, senior_delegate1, senior_delegate1, "candidate_delegate", nil)

      expect(mail.body.encoded).to match("Eddard Stark has changed the Delegate status of Daenerys Targaryen from Junior Delegate to Registered Speedcuber.")
      expect(mail.body.encoded).not_to match("Warning")
      expect(mail.body.encoded).to match(edit_user_url(delegate))
    end

    it "renders a warning if someone other than their senior delegate makes the change" do
      delegate.update!(delegate_status: "delegate")
      mail = DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(delegate, senior_delegate2, senior_delegate1, "candidate_delegate", "delegate")

      expect(mail.body.encoded).to match("Warning: Catelyn Stark is not Daenerys Targaryen's Senior Delegate.")
    end
  end
end
