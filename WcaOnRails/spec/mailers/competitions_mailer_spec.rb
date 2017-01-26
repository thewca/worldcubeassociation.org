# frozen_string_literal: true
require "rails_helper"

RSpec.describe CompetitionsMailer, type: :mailer do
  describe "notify_board_of_confirmed_competition" do
    let(:delegate) { FactoryGirl.create :delegate }
    let(:second_delegate) { FactoryGirl.create :delegate }
    let(:competition) { FactoryGirl.create :competition, delegates: [delegate, second_delegate] }
    let(:mail) { CompetitionsMailer.notify_board_of_confirmed_competition(delegate, competition) }

    it "renders" do
      expect(mail.to).to eq(["board@worldcubeassociation.org"])
      expect(mail.cc).to match_array competition.delegates.pluck(:email)
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
      expect(mail.reply_to).to eq([delegate.email])

      expect(mail.subject).to eq("#{delegate.name} just confirmed #{competition.name}")
      expect(mail.body.encoded).to match("#{competition.name} is confirmed")
      expect(mail.body.encoded).to match(admin_edit_competition_url(competition))
    end
  end

  describe "notify_users_of_results_presence" do
    let(:competition) { FactoryGirl.create :competition, :with_delegate }
    let(:competitor_user) { FactoryGirl.create :user, :wca_id }
    let(:mail) { CompetitionsMailer.notify_users_of_results_presence(competitor_user, competition) }

    it "renders the headers" do
      expect(mail.subject).to eq "The results of #{competition.name} are posted"
      expect(mail.to).to eq [competitor_user.email]
      expect(mail.from).to eq ["notifications@worldcubeassociation.org"]
      expect(mail.reply_to).to match_array competition.delegates.pluck(:email)
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(/Your results at .+ have just been posted./)
    end
  end

  describe "notify_users_of_id_claim_possibility" do
    let(:competition) { FactoryGirl.create :competition }
    let(:newcomer_user) { FactoryGirl.create :user }
    let(:mail) { CompetitionsMailer.notify_users_of_id_claim_possibility(newcomer_user, competition) }

    it "renders the headers" do
      expect(mail.subject).to eq "Please link your WCA ID with your account"
      expect(mail.to).to eq [newcomer_user.email]
      expect(mail.reply_to).to match_array competition.delegates.pluck(:email)
      expect(mail.from).to eq ["notifications@worldcubeassociation.org"]
    end

    it "renders the body" do
      expect(mail.body.encoded).to match competition.name
      expect(mail.body.encoded).to match profile_claim_wca_id_url
    end
  end

  describe "submit_results_nag" do
    let(:competition) do
      FactoryGirl.create(:competition, name: "Comp of the Future 2016")
    end
    let(:mail) { CompetitionsMailer.submit_results_nag(competition) }

    it "renders the headers" do
      expect(mail.subject).to eq "Comp of the Future 2016 Results"
      expect(mail.to).to match_array competition.delegates.pluck(:email)
      expect(mail.cc).to eq ["results@worldcubeassociation.org"]
      expect(mail.reply_to).to eq ["results@worldcubeassociation.org"]
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(/Over a week has passed since #{competition.name}/)
    end
  end

  describe "notify_of_delegate_report_submission" do
    let(:competition) do
      competition = FactoryGirl.create(:competition, :with_delegate_report, countryId: "Australia", name: "Comp of the Future 2016", starts: Date.new(2016, 2, 1), ends: Date.new(2016, 2, 2))
      competition.delegate_report.update_attributes!(remarks: "This was a great competition")
      competition
    end
    let(:mail) do
      # Let's pick a foreign locale to make sure it's not localized
      I18n.locale = :fr
      CompetitionsMailer.notify_of_delegate_report_submission(competition)
    end

    it "renders the headers" do
      expect(mail.subject).to eq "[wca-report] [Oceania] Comp of the Future 2016"
      expect(mail.to).to eq ["delegates@worldcubeassociation.org"]
      expect(mail.cc).to match_array competition.delegates.pluck(:email)
      expect(mail.from).to eq ["notifications@worldcubeassociation.org"]
      expect(mail.reply_to).to match_array competition.delegates.pluck(:email)
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(/This was a great competition/)
    end

    it "is sent in English" do
      # Will fail if the date is localized, in French it will be "fév. 1"
      expect(mail.body.encoded).to match(/Feb 1/)
    end
  end
end
