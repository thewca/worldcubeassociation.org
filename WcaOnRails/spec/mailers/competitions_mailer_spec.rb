# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompetitionsMailer, type: :mailer do
  describe "notify_wcat_of_confirmed_competition" do
    let(:senior_delegate) { FactoryBot.create :senior_delegate }
    let(:delegate) { FactoryBot.create :delegate, senior_delegate: senior_delegate }
    let(:second_delegate) { FactoryBot.create :delegate, senior_delegate: senior_delegate }
    let(:third_delegate) { FactoryBot.create :delegate }
    let(:competition) { FactoryBot.create :competition, :with_competitor_limit, championship_types: %w(world PL), delegates: [delegate, second_delegate, third_delegate] }
    let(:mail) do
      I18n.locale = :pl
      CompetitionsMailer.notify_wcat_of_confirmed_competition(delegate, competition)
    end

    it "renders in English" do
      expect(mail.to).to eq(["competitions@worldcubeassociation.org"])
      expect(mail.cc).to match_array(competition.delegates.pluck(:email) + [senior_delegate.email, third_delegate.senior_delegate.email])
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
      expect(mail.reply_to).to eq([delegate.email])

      expect(mail.subject).to eq("#{delegate.name} just confirmed #{competition.name}")
      expect(mail.body.encoded).to match("#{competition.name} is confirmed")
      expect(mail.body.encoded).to match("This competition is marked as World Championship and National Championship: Poland")
      expect(mail.body.encoded).to match("There is a competitor limit of 100 because \"The hall only fits 100 competitors.\"")
      expect(mail.body.encoded).to match(admin_edit_competition_url(competition))
    end
  end

  describe "notify_organizers_of_confirmed_competition" do
    let(:delegate) { FactoryBot.create :delegate, name: "Adam Smith" }
    let(:organizer) { FactoryBot.create :user, name: "Will Johnson" }
    let(:competition) { FactoryBot.create :competition, organizers: [organizer], delegates: [delegate] }
    let(:mail) { CompetitionsMailer.notify_organizers_of_confirmed_competition(delegate, competition) }

    it "renders" do
      expect(mail.to).to eq(competition.organizers.pluck(:email))
      expect(mail.reply_to).to eq(competition.delegates.pluck(:email))
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
      expect(mail.subject).to eq("#{delegate.name} confirmed #{competition.name}")
      expect(mail.body.encoded).to match("Your competition Delegate #{delegate.name} confirmed #{competition.name} and sent the submission to the WCAT.")
    end

    it "sends no email if there are no organizers" do
      competition.organizers = []
      expect(mail.message).to be_kind_of ActionMailer::Base::NullMail
    end
  end

  describe "notify_organizers_of_announced_competition" do
    let!(:post) { FactoryBot.create(:post, created_at: 1.hours.ago) }
    let(:delegate) { FactoryBot.create :delegate, name: "Adam Smith" }
    let(:organizer) { FactoryBot.create :user, name: "Will Johnson" }
    let(:competition) { FactoryBot.create :competition, organizers: [organizer], delegates: [delegate] }
    let(:mail) { CompetitionsMailer.notify_organizers_of_announced_competition(competition, post) }

    it "renders" do
      expect(mail.to).to eq(competition.organizers.pluck(:email))
      expect(mail.reply_to).to eq(competition.delegates.pluck(:email))
      expect(mail.subject).to eq "The WCAT announced #{competition.name}"
      expect(mail.body.encoded).to match("Dear organizers of #{competition.name}")
      expect(mail.body.encoded).to match("The WCAT approved your competition and officially announced it to the public.")
    end

    it "sends no email if there are no organizers" do
      competition.organizers = []
      expect(mail.message).to be_kind_of ActionMailer::Base::NullMail
    end
  end

  describe "notify_organizer_of_addition_to_competititon" do
    let(:delegate) { FactoryBot.create :delegate, name: "Adam Smith" }
    let(:organizer) { FactoryBot.create :user, name: "Will Johnson" }
    let(:competition) { FactoryBot.create :competition, organizers: [organizer], delegates: [delegate] }
    let(:mail) { CompetitionsMailer.notify_organizer_of_addition_to_competition(delegate, competition, organizer) }

    it "renders" do
      expect(mail.to).to eq([organizer.email])
      expect(mail.reply_to).to eq(competition.delegates.pluck(:email))
      expect(mail.subject).to eq "You were added to #{competition.name} as an organizer"
      expect(mail.body.encoded).to match("Hello #{organizer.name}")
      expect(mail.body.encoded).to match("#{delegate.name} added you to #{competition.name} as an organizer.")
    end
  end

  describe "notify_organizer_of_removal_from_competition" do
    let(:delegate) { FactoryBot.create :delegate, name: "Adam Smith" }
    let(:organizer) { FactoryBot.create :user, name: "Will Johnson" }
    let(:competition) { FactoryBot.create :competition, organizers: [organizer], delegates: [delegate] }
    let(:mail) { CompetitionsMailer.notify_organizer_of_removal_from_competition(delegate, competition, organizer) }

    it "renders" do
      expect(mail.to).to eq([organizer.email])
      expect(mail.reply_to).to eq(competition.delegates.pluck(:email))
      expect(mail.subject).to eq "You were removed from #{competition.name} as an organizer"
      expect(mail.body.encoded).to match("Hello #{organizer.name}")
      expect(mail.body.encoded).to match("#{delegate.name} removed you from #{competition.name} as an organizer.")
    end
  end

  describe "notify_users_of_results_presence" do
    let(:competition) { FactoryBot.create :competition, :with_delegate }
    let(:competitor_user) { FactoryBot.create :user, :wca_id }
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
    let(:competition) { FactoryBot.create :competition }
    let(:newcomer_user) { FactoryBot.create :user }
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
    let(:senior) { FactoryBot.create(:senior_delegate) }
    let(:delegate) { FactoryBot.create(:delegate, senior_delegate_id: senior.id) }
    let(:competition) do
      FactoryBot.create(:competition, name: "Comp of the Future 2016", delegates: [delegate])
    end
    let(:mail) { CompetitionsMailer.submit_results_nag(competition) }

    it "renders the headers" do
      expect(mail.subject).to eq "Comp of the Future 2016 Results"
      expect(mail.to).to match_array competition.delegates.pluck(:email)
      expect(mail.cc).to eq ["results@worldcubeassociation.org", "quality@worldcubeassociation.org", senior.email]
      expect(mail.reply_to).to eq ["results@worldcubeassociation.org"]
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(/Over a week has passed since #{competition.name}/)
      expect(mail.body.encoded).to match(competition_submit_results_edit_path(competition.id))
    end
  end

  describe "submit_report_nag" do
    let(:senior) { FactoryBot.create(:senior_delegate) }
    let(:delegate) { FactoryBot.create(:delegate, senior_delegate_id: senior.id) }
    let(:competition) { FactoryBot.create(:competition, name: "Peculiar Comp 2016", delegates: [delegate], starts: 5.days.ago, ends: 3.days.ago) }
    let(:mail) { CompetitionsMailer.submit_report_nag(competition) }

    it "renders the headers" do
      expect(mail.subject).to eq "Peculiar Comp 2016 Delegate Report"
      expect(mail.to).to match_array competition.delegates.pluck(:email)
      expect(mail.cc).to eq ["quality@worldcubeassociation.org", senior.email]
      expect(mail.reply_to).to eq [senior.email]
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(/Peculiar Comp 2016 took place 3 days ago/)
      expect(mail.body.encoded).to match(/Delegate report/)
    end
  end

  describe "notify_of_delegate_report_submission" do
    let(:competition) do
      competition = FactoryBot.create(:competition, :with_delegate_report, countryId: "Australia", cityName: "Perth, Western Australia", name: "Comp of the Future 2016", starts: Date.new(2016, 2, 1), ends: Date.new(2016, 2, 2))
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
      expect(mail.to).to eq ["reports@worldcubeassociation.org"]
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

  describe "results_submitted" do
    let(:delegates) { FactoryBot.create_list(:delegate, 3) }
    let(:competition) { FactoryBot.create(:competition, name: "Comp of the future 2017", id: "CompFut2017", delegates: delegates) }
    let(:results_submission) {
      FactoryBot.build(
        :results_submission,
        schedule_url: link_to_competition_schedule_tab(competition),
        message: "Hello, here are the results",
      )
    }
    let(:mail) { CompetitionsMailer.results_submitted(competition, results_submission, delegates.first) }
    let(:utc_now) { Time.utc(2018, 2, 23, 22, 3, 32) }

    before(:each) do
      allow(Time).to receive(:now).and_return(utc_now)
    end

    it "renders the headers" do
      expect(mail.subject).to eq "Results for Comp of the future 2017"
      expect(mail.to).to eq ["results@worldcubeassociation.org"]
      expect(mail.cc).to match_array competition.delegates.pluck(:email)
      expect(mail.from).to eq ["notifications@worldcubeassociation.org"]
      expect(mail.reply_to).to match_array competition.delegates.pluck(:email)
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(/Hello, here are the results/)
      expect(mail.body.encoded).to include(link_to_competition_schedule_tab(competition))
    end
  end
end
