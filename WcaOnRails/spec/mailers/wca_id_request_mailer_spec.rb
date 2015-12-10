require "rails_helper"

RSpec.describe WcaIdRequestMailer, type: :mailer do
  describe "notify_board_of_confirmed_competition" do
    let(:delegate) { FactoryGirl.create :delegate }
    let(:person) { FactoryGirl.create :person }
    let(:user_requesting_wca_id) { FactoryGirl.create :user, unconfirmed_wca_id: person.id, delegate_to_handle_wca_id_request: delegate }
    let(:mail) { WcaIdRequestMailer.notify_delegate_of_wca_id_request(user_requesting_wca_id) }

    it "renders" do
      expect(mail.to).to eq([delegate.email])
      expect(mail.cc).to eq([user_requesting_wca_id.email])
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
      expect(mail.reply_to).to eq([user_requesting_wca_id.email])

      expect(mail.subject).to eq("#{user_requesting_wca_id.email} just requested WCA id #{person.id}")
      expect(mail.body.encoded).to match(edit_user_path(user_requesting_wca_id.id, anchor: "wca_id"))
    end
  end
end
