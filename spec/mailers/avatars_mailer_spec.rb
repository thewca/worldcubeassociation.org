# frozen_string_literal: true

require "rails_helper"

RSpec.describe AvatarsMailer do
  describe "notify_user_of_avatar_rejection" do
    let(:user) { create(:user, name: "Sherlock Holmes") }
    let(:rejection_reason) { "The avatar must not include texts other than regular background texts." }
    let(:mail) { AvatarsMailer.notify_user_of_avatar_rejection(user, rejection_reason) }

    it "renders the headers" do
      expect(mail.subject).to eq "Your avatar has been rejected"
      expect(mail.to).to eq [user.email]
      expect(mail.reply_to).to eq ["results@worldcubeassociation.org"]
      expect(mail.from).to eq ["results@worldcubeassociation.org"]
    end

    it "renders the body" do
      expect(mail.body.encoded).to match user.name
      expect(mail.body.encoded).to match rejection_reason
    end

    it "does not attach the picture by default" do
      expect(mail.attachments).to be_empty
    end

    context "with the rejected avatar attached" do
      let(:avatar) { create(:user_avatar, user: user, status: UserAvatar.statuses[:rejected], backend: UserAvatar.backends[:active_storage], upload_file: true) }
      let(:mail) { AvatarsMailer.notify_user_of_avatar_rejection(user, rejection_reason, attached_avatar: avatar) }

      it "embeds the picture inline" do
        expect(mail.attachments.size).to eq 1
        expect(mail.attachments.first).to be_inline
        expect(mail.attachments.first.filename).to eq UserAvatar::DEFAULT_AVATAR_FILE
        expect(mail.html_part.body.encoded).to match "This is the picture that was rejected"
      end
    end
  end

  describe 'notify_user_of_avatar_removal' do
    let(:remover_user) { create(:user, name: 'Enola Holmes') }
    let(:user) { create(:user, name: 'Sherlock Holmes') }
    let(:rejection_reason) { 'The avatar must not include texts other than regular background texts.' }
    let(:mail) { described_class.notify_user_of_avatar_removal(remover_user, user, rejection_reason) }

    it 'renders the headers' do
      expect(mail.subject).to eq "Your avatar has been removed by #{remover_user.name}"
      expect(mail.to).to eq [user.email]
      expect(mail.from).to eq ['results@worldcubeassociation.org']
    end

    it 'renders the body' do
      expect(mail.body.encoded).to match remover_user.name
      expect(mail.body.encoded).to match user.name
      expect(mail.body.encoded).to match rejection_reason
    end

    it 'does not attach the picture by default' do
      expect(mail.attachments).to be_empty
    end

    context 'with the removed avatar attached' do
      let(:avatar) { create(:user_avatar, user: user, status: UserAvatar.statuses[:deleted], backend: UserAvatar.backends[:active_storage], upload_file: true) }
      let(:mail) { described_class.notify_user_of_avatar_removal(remover_user, user, rejection_reason, attached_avatar: avatar) }

      it 'embeds the picture inline' do
        expect(mail.attachments.size).to eq 1
        expect(mail.attachments.first).to be_inline
        expect(mail.html_part.body.encoded).to match 'This is the picture that was removed'
      end
    end

    context 'with a legacy avatar that has no stored file' do
      let(:avatar) { create(:user_avatar, user: user, status: UserAvatar.statuses[:deleted]) }
      let(:mail) { described_class.notify_user_of_avatar_removal(remover_user, user, rejection_reason, attached_avatar: avatar) }

      it 'sends the email without the picture' do
        expect(mail.attachments).to be_empty
        expect(mail.body.encoded).not_to match 'This is the picture that was removed'
      end
    end
  end
end
