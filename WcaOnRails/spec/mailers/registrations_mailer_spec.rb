require "rails_helper"

RSpec.describe RegistrationsMailer, type: :mailer do
  let(:delegate1) { FactoryGirl.create :delegate }
  let(:delegate2) { FactoryGirl.create :delegate }
  let(:competition) { FactoryGirl.create(:competition, delegates: [delegate1, delegate2]) }

  describe "notify_organizers_of_new_registration" do
    let(:registration) { FactoryGirl.create(:registration, competition: competition) }
    let(:mail) { RegistrationsMailer.notify_organizers_of_new_registration(registration) }

    it "renders the headers" do
      competition_delegate2 = competition.competition_delegates.find_by_delegate_id(delegate2.id)
      competition_delegate2.receive_registration_emails = false
      competition_delegate2.save!

      expect(mail.subject).to eq("#{registration.name} just registered for #{registration.competition.name}")
      expect(mail.to).to eq([delegate1.email])
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(edit_registration_url(registration))
    end

    it "handles no organizers receiving email" do
      competition_delegate1 = competition.competition_delegates.find_by_delegate_id(delegate1.id)
      competition_delegate1.receive_registration_emails = false
      competition_delegate1.save!

      competition_delegate2 = competition.competition_delegates.find_by_delegate_id(delegate2.id)
      competition_delegate2.receive_registration_emails = false
      competition_delegate2.save!

      expect(mail.message).to be_kind_of ActionMailer::Base::NullMail
    end
  end

  describe "notify_registrant_of_new_registration" do
    let(:registration) { FactoryGirl.create(:registration, competition: competition) }
    let!(:earlier_registration) { FactoryGirl.create(:registration, competition: competition) }
    let(:mail) { RegistrationsMailer.notify_registrant_of_new_registration(registration) }

    it "renders the headers" do
      expect(mail.subject).to eq("You have registered for #{registration.competition.name}")
      expect(mail.to).to eq([registration.email])
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("The waiting list currently has 2 people on it.")
      expect(mail.body.encoded).to match(competition_register_url(registration.competition))
    end
  end

  describe "accepted_registration" do
    let(:mail) { RegistrationsMailer.accepted_registration(registration) }
    let(:registration) { FactoryGirl.create(:userless_registration, competition: competition) }

    it "renders the headers" do
      expect(mail.subject).to eq("Your registration for #{registration.competition.name} has been approved!")
      expect(mail.to).to eq([registration.email])
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("Your registration for #{registration.competition.name} has been approved")
    end
  end
end
