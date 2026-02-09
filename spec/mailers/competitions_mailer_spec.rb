# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompetitionsMailer do
  describe "notify_wcat_of_confirmed_competition" do
    let(:senior_delegate_role) { create(:senior_delegate_role) }
    let(:delegate_role) { create(:delegate_role, group: senior_delegate_role.group) }
    let(:second_senior_delegate_role) { create(:senior_delegate_role, group: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia').user_group) }
    let(:second_delegate_role) { create(:delegate_role, group: senior_delegate_role.group) }
    let(:third_delegate_role) { create(:trainee_delegate_role, group: second_senior_delegate_role.group) }
    let(:competition) { create(:competition, :with_competitor_limit, championship_types: %w[world PL], delegates: [delegate_role.user, second_delegate_role.user, third_delegate_role.user]) }
    let(:mail) do
      I18n.with_locale(:pl) do
        CompetitionsMailer.notify_wcat_of_confirmed_competition(delegate_role.user, competition)
      end
    end

    it "renders in English" do
      expect(mail.to).to eq(["competitions@worldcubeassociation.org"])
      expect(mail.cc).to match_array(competition.delegates.reload.pluck(:email) + [senior_delegate_role.user.email, second_senior_delegate_role.user.email])
      expect(mail.from).to eq(["competitions@worldcubeassociation.org"])
      expect(mail.reply_to).to eq([delegate_role.user.email])

      expect(mail.subject).to eq("#{competition.name} is confirmed")
      expect(mail.body.encoded).to match("#{delegate_role.user.name} has confirmed")
      expect(mail.body.encoded).to match(competition_admin_edit_url(competition))
      expect(mail.body.encoded).to match("The competition will take place on ")
      expect(mail.body.encoded).to match("This competition is marked as World Championship and National Championship: Poland")
      expect(mail.body.encoded).to match("There is a competitor limit of 100 because \"The hall only fits 100 competitors.\"")
      expect(mail.body.encoded).to match(second_delegate_role.user.name)
      expect(mail.body.encoded).to match(third_delegate_role.user.name)
    end
  end

  describe "notify_organizer_of_confirmed_competition" do
    let(:delegate) { create(:delegate, name: "Adam Smith") }
    let(:trainee_delegate) { create(:trainee_delegate) }
    let(:organizer) { create(:user, name: "Will Johnson", preferred_locale: :en) }
    let(:competition) { create(:competition, organizers: [organizer], delegates: [delegate, trainee_delegate]) }
    let(:mail) { CompetitionsMailer.notify_organizer_of_confirmed_competition(delegate, competition, organizer) }

    it "renders" do
      I18n.with_locale :fr do
        expect(mail.to).to eq(competition.organizers.pluck(:email))
        expect(mail.reply_to).to eq(competition.delegates.pluck(:email))
        expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
        expect(mail.subject).to eq("#{delegate.name} confirmed #{competition.name}")
        expect(mail.body.encoded).to match("Your competition Delegate #{delegate.name} confirmed #{competition.name} and sent the submission to the WCAT.")
      end
    end
  end

  describe "notify_organizer_of_announced_competition" do
    let(:delegate) { create(:delegate, name: "Adam Smith") }
    let(:organizer) { create(:user, name: "Will Johnson", preferred_locale: :en) }
    let(:competition) { create(:competition, organizers: [organizer], delegates: [delegate]) }
    let(:mail) { CompetitionsMailer.notify_organizer_of_announced_competition(competition, organizer) }

    it "renders" do
      I18n.with_locale :fr do
        expect(mail.to).to eq(competition.organizers.pluck(:email))
        expect(mail.reply_to).to eq(competition.delegates.pluck(:email))
        expect(mail.subject).to eq "The WCAT announced #{competition.name}"
        expect(mail.body.encoded).to match("Dear organizers of #{competition.name}")
        expect(mail.body.encoded).to match("The WCAT approved your competition and officially announced it to the public.")
      end
    end
  end

  describe "notify_organizer_of_addition_to_competition" do
    let(:delegate) { create(:delegate, name: "Adam Smith") }
    let(:trainee_delegate) { create(:trainee_delegate) }
    let(:organizer) { create(:user, name: "Will Johnson", preferred_locale: :en) }
    let(:competition) { create(:competition, organizers: [organizer], delegates: [delegate, trainee_delegate]) }
    let(:mail) { CompetitionsMailer.notify_organizer_of_addition_to_competition(delegate, competition, organizer) }

    it "renders" do
      I18n.with_locale :fr do
        expect(mail.to).to eq([organizer.email])
        expect(mail.reply_to).to eq(competition.delegates.pluck(:email))
        expect(mail.subject).to eq "You were added to #{competition.name} as an organizer"
        expect(mail.body.encoded).to match("Hello #{organizer.name}")
        expect(mail.body.encoded).to match("#{delegate.name} added you to #{competition.name} as an organizer.")
      end
    end
  end

  describe "notify_organizer_of_removal_from_competition" do
    let(:delegate) { create(:delegate, name: "Adam Smith") }
    let(:trainee_delegate) { create(:trainee_delegate) }
    let(:organizer) { create(:user, name: "Will Johnson", preferred_locale: :en) }
    let(:competition) { create(:competition, organizers: [organizer], delegates: [delegate, trainee_delegate]) }
    let(:mail) { CompetitionsMailer.notify_organizer_of_removal_from_competition(delegate, competition, organizer) }

    it "renders" do
      I18n.with_locale :fr do
        expect(mail.to).to eq([organizer.email])
        expect(mail.reply_to).to eq(competition.delegates.pluck(:email))
        expect(mail.subject).to eq "You were removed from #{competition.name} as an organizer"
        expect(mail.body.encoded).to match("Hello #{organizer.name}")
        expect(mail.body.encoded).to match("#{delegate.name} removed you from #{competition.name} as an organizer.")
      end
    end
  end

  describe "notify_users_of_results_presence" do
    let(:competition) { create(:competition, :with_delegate, :with_trainee_delegate) }
    let(:competitor_user) { create(:user, :wca_id) }
    let(:mail) { CompetitionsMailer.notify_users_of_results_presence(competitor_user, competition) }

    it "renders" do
      I18n.with_locale :en do
        expect(mail.to).to eq [competitor_user.email]
        expect(mail.from).to eq ["notifications@worldcubeassociation.org"]
        expect(mail.reply_to).to match_array competition.delegates.pluck(:email)
        expect(mail.subject).to eq "The results of #{competition.name} are posted"
        expect(mail.body.encoded).to match(/Your results at .+ have just been posted./)
      end
    end
  end

  describe "notify_users_of_id_claim_possibility" do
    let(:competition) { create(:competition, :with_delegate, :with_trainee_delegate) }
    let(:newcomer_user) { create(:user) }
    let(:mail) { CompetitionsMailer.notify_users_of_id_claim_possibility(newcomer_user, competition) }

    it "renders" do
      I18n.with_locale :en do
        expect(mail.to).to eq [newcomer_user.email]
        expect(mail.reply_to).to match_array competition.delegates.pluck(:email)
        expect(mail.subject).to eq "Please link your WCA ID with your account"
        expect(mail.body.encoded).to match competition.name
        expect(mail.body.encoded).to match profile_claim_wca_id_url
      end
    end
  end

  describe "submit_results_nag" do
    let(:senior) { create(:senior_delegate_role) }
    let(:delegate) { create(:delegate_role) }
    let(:trainee_delegate) { create(:trainee_delegate_role) }
    let(:competition) do
      create(:competition, name: "Comp of the Future 2016", delegates: [delegate.user, trainee_delegate.user])
    end
    let(:mail) { CompetitionsMailer.submit_results_nag(competition) }

    it "renders the headers" do
      expect(mail.subject).to eq "Comp of the Future 2016 Results"
      expect(mail.to).to match_array competition.delegates.pluck(:email)
      expect(mail.from).to eq ["assistants@worldcubeassociation.org"]
      expect(mail.cc).to eq ["results@worldcubeassociation.org", "assistants@worldcubeassociation.org", delegate.group.senior_delegate.email]
      expect(mail.reply_to).to eq ["results@worldcubeassociation.org"]
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(/Over a week has passed since #{competition.name}/)
      expect(mail.body.encoded).to match(competition_submit_results_edit_path(competition.id))
    end
  end

  describe "submit_report_nag" do
    let(:delegate) { create(:delegate_role) }
    let(:trainee_delegate) { create(:trainee_delegate_role) }
    let(:competition) { create(:competition, name: "Peculiar Comp 2016", delegates: [delegate.user, trainee_delegate.user], starts: 5.days.ago, ends: 3.days.ago) }
    let(:mail) { CompetitionsMailer.submit_report_nag(competition) }

    it "renders the headers" do
      expect(mail.subject).to eq "Peculiar Comp 2016 Delegate Report"
      expect(mail.to).to match_array competition.delegates.pluck(:email)
      expect(mail.from).to eq ["assistants@worldcubeassociation.org"]
      expect(mail.cc).to eq ["assistants@worldcubeassociation.org", delegate.group.senior_delegate.email]
      expect(mail.reply_to).to eq [delegate.group.senior_delegate.email]
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(/Peculiar Comp 2016 took place 3 days ago/)
      expect(mail.body.encoded).to match(/Delegate report/)
    end
  end

  describe "notify_of_delegate_report_submission" do
    let(:delegate) { create(:delegate_role) }
    let(:trainee_delegate) { create(:trainee_delegate_role) }
    let(:competition) do
      competition = create(:competition, :with_delegate_report,
                           country_id: "Australia",
                           city_name: "Perth, Western Australia",
                           name: "Comp of the Future 2016",
                           delegates: [delegate.user, trainee_delegate.user],
                           starts: Date.new(2016, 2, 1),
                           ends: Date.new(2016, 2, 2))
      competition.delegate_report.update!(remarks: "This was a great competition")
      competition
    end
    let(:mail) do
      # Let's pick a foreign locale to make sure it's not localized
      I18n.with_locale(:fr) do
        CompetitionsMailer.notify_of_delegate_report_submission(competition)
      end
    end

    context "wrc & wic feedback requested" do
      before(:each) do
        competition.delegate_report.update!(wrc_feedback_requested: true, wrc_incidents: "1, 2, 3", wic_feedback_requested: true, wic_incidents: "4, 5, 6")
      end

      it "renders the headers" do
        expect(mail.subject).to eq "[wca-report] [Oceania] Comp of the Future 2016"
        expect(mail.to).to eq ["reports.oceania.AU@worldcubeassociation.org"]
        expect(mail.cc).to match_array competition.delegates.pluck(:email) + ["regulations@worldcubeassociation.org"] + ["integrity@worldcubeassociation.org"]
        expect(mail.from).to eq ["reports@worldcubeassociation.org"]
        expect(mail.reply_to).to match_array competition.delegates.pluck(:email)
      end

      it "renders the body" do
        expect(mail.body.encoded).to match(/@WRC: Feedback requested on incidents: 1, 2, 3/)
        expect(mail.body.encoded).to match(/@WIC: Feedback requested on incidents: 4, 5, 6/)
        expect(mail.body.encoded).to match(/This was a great competition/)
      end
    end

    context "wic feedback requested" do
      before(:each) do
        competition.delegate_report.update!(wic_feedback_requested: true, wic_incidents: "4, 5, 6")
      end

      it "renders the headers" do
        expect(mail.subject).to eq "[wca-report] [Oceania] Comp of the Future 2016"
        expect(mail.to).to eq ["reports.oceania.AU@worldcubeassociation.org"]
        expect(mail.cc).to match_array competition.delegates.pluck(:email) + ["integrity@worldcubeassociation.org"]
        expect(mail.from).to eq ["reports@worldcubeassociation.org"]
        expect(mail.reply_to).to match_array competition.delegates.pluck(:email)
      end

      it "renders the body" do
        expect(mail.body.encoded).not_to match(/@WRC/)
        expect(mail.body.encoded).to match(/@WIC: Feedback requested on incidents: 4, 5, 6/)
        expect(mail.body.encoded).to match(/This was a great competition/)
      end
    end

    context "wrc feedback requested" do
      before(:each) do
        competition.delegate_report.update!(wrc_feedback_requested: true, wrc_incidents: "1, 2, 3")
      end

      it "renders the headers" do
        expect(mail.subject).to eq "[wca-report] [Oceania] Comp of the Future 2016"
        expect(mail.to).to eq ["reports.oceania.AU@worldcubeassociation.org"]
        expect(mail.cc).to match_array competition.delegates.pluck(:email) + ["regulations@worldcubeassociation.org"]
        expect(mail.from).to eq ["reports@worldcubeassociation.org"]
        expect(mail.reply_to).to match_array competition.delegates.pluck(:email)
      end

      it "renders the body" do
        expect(mail.body.encoded).to match(/@WRC: Feedback requested on incidents: 1, 2, 3/)
        expect(mail.body.encoded).not_to match(/@WIC/)
        expect(mail.body.encoded).to match(/This was a great competition/)
      end
    end

    context "no wrc nor wic feedback" do
      it "renders the headers" do
        expect(mail.subject).to eq "[wca-report] [Oceania] Comp of the Future 2016"
        expect(mail.to).to eq ["reports.oceania.AU@worldcubeassociation.org"]
        expect(mail.cc).to match_array competition.delegates.pluck(:email)
        expect(mail.from).to eq ["reports@worldcubeassociation.org"]
        expect(mail.reply_to).to match_array competition.delegates.pluck(:email)
      end

      it "renders the body" do
        expect(mail.body.encoded).not_to match(/@WRC/)
        expect(mail.body.encoded).not_to match(/@WIC/)
        expect(mail.body.encoded).to match(/This was a great competition/)
      end
    end

    context "multi-national competition" do
      let(:competition) do
        create(:competition,
               :with_delegate_report,
               :with_valid_schedule,
               country_id: "XE",
               city_name: "Multiple Cities",
               name: "FMC Europe 2016",
               delegates: [delegate.user, trainee_delegate.user],
               starts: Date.new(2016, 2, 1),
               ends: Date.new(2016, 2, 2))
      end

      it "renders the headers" do
        countries = competition.continent.countries.sample(competition.competition_venues.count)

        competition.competition_venues.each_with_index do |competition_venue, index|
          competition_venue.update!(country_iso2: countries[index].iso2)
        end

        expect(mail.subject).to eq "[wca-report] [Europe] FMC Europe 2016"
        expect(mail.to).to eq(countries.map { |c| DelegateReport.country_mailing_list(c) })
        expect(mail.cc).to match_array competition.delegates.pluck(:email)
        expect(mail.from).to eq ["reports@worldcubeassociation.org"]
        expect(mail.reply_to).to match_array competition.delegates.pluck(:email)
      end
    end

    context "multi-continent competition" do
      let(:competition) do
        create(:competition,
               :with_delegate_report,
               :with_valid_schedule,
               country_id: "XW",
               city_name: "Multiple Cities",
               name: "FMC World 2016",
               delegates: [delegate.user, trainee_delegate.user],
               starts: Date.new(2016, 2, 1),
               ends: Date.new(2016, 2, 2))
      end

      it "renders the headers" do
        continents = Continent.real.sample(competition.competition_venues.count)

        competition.competition_venues.each_with_index do |competition_venue, index|
          country = continents[index].countries.sample
          competition_venue.update!(country_iso2: country.iso2)
        end

        expect(mail.subject).to eq "[wca-report] [Multiple Continents] FMC World 2016"
        expect(mail.to).to eq(competition.venue_continents.map { |c| DelegateReport.continent_mailing_list(c) })
        expect(mail.cc).to match_array competition.delegates.pluck(:email)
        expect(mail.from).to eq ["reports@worldcubeassociation.org"]
        expect(mail.reply_to).to match_array competition.delegates.pluck(:email)
      end
    end

    it "is sent in English" do
      # Will fail if the date is localized, in French it will be "fév. 1"
      expect(mail.body.encoded).to match(/Feb 1/)
    end
  end

  describe "wrc_delegate_report_followup" do
    let(:competition) do
      competition = create(:competition, :with_delegate_report, country_id: "Australia", city_name: "Perth, Western Australia", name: "Comp of the Future 2016", starts: Date.new(2016, 2, 1), ends: Date.new(2016, 2, 2))
      competition.delegate_report.update!(remarks: "This was a great competition")
      competition.delegate_report.wrc_primary_user = create :user, :wrc_member, name: "Jean"
      competition.delegate_report.wrc_secondary_user = create :user, :wrc_member, name: "Michel"
      competition
    end
    let(:main_mail) do
      CompetitionsMailer.notify_of_delegate_report_submission(competition)
    end
    let(:followup_mail) do
      CompetitionsMailer.wrc_delegate_report_followup(competition)
    end

    it "renders the body" do
      # Check heuristics to ensure that GMail puts these emails in the same thread.
      expect(followup_mail.from).to eq(main_mail.from)
      expect(followup_mail.subject).to eq(main_mail.subject)

      # Check content
      expect(followup_mail.body.encoded).to match(/Hello WRC members/)
      expect(followup_mail.body.encoded).to match(competition.delegate_report.wrc_primary_user.name)
      expect(followup_mail.body.encoded).to match(competition.delegate_report.wrc_secondary_user.name)
    end
  end

  describe "results_submitted" do
    let(:delegates) { create_list(:delegate, 3) }
    let(:trainee_delegates) { create_list(:trainee_delegate, 3) }
    let(:competition) { create(:competition, name: "Comp of the future 2017", id: "CompFut2017", delegates: delegates + trainee_delegates) }
    let(:results_validator) { ResultsValidators::CompetitionsResultsValidator.create_full_validation.validate(competition.id) }
    let(:message) { "Hello, here are the results" }
    let(:mail) { CompetitionsMailer.results_submitted(competition, results_validator, message, delegates.first) }
    let(:utc_now) { Time.utc(2018, 2, 23, 22, 3, 32) }

    before(:each) do
      allow(Time).to receive(:now).and_return(utc_now)
    end

    it "renders the headers" do
      expect(mail.subject).to eq "Results for Comp of the future 2017"
      expect(mail.to).to eq ["results@worldcubeassociation.org"]
      expect(mail.cc).to match_array competition.delegates.pluck(:email)
      expect(mail.from).to eq ["results@worldcubeassociation.org"]
      expect(mail.reply_to).to match_array competition.delegates.pluck(:email)
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(/Hello, here are the results/)
      expect(mail.body.encoded).to include(link_to_competition_schedule_tab(competition))
    end
  end

  describe "registration_reminder_email" do
    let(:competitor) { create(:user) }
    let(:competition) { create(:competition, :with_organizer, :with_delegate, name: "Comp of the future 2020", id: "CompFut2020") }

    context "non-registered user" do
      let(:mail) { CompetitionsMailer.registration_reminder(competition, competitor, false) }

      it "renders the headers" do
        expect(mail.subject).to eq "Comp of the future 2020 registration opens soon"
        expect(mail.to).to eq [competitor.email]
        expect(mail.reply_to).to eq competition.organizers.pluck(:email)
      end

      it "renders the body" do
        expect(mail.body.encoded).to match(/This is a reminder that registration/)
        expect(mail.body.encoded).not_to match(/You have registered/)
        expect(mail.body.encoded).to include(competition_url(competition))
      end
    end

    context "registered but not accepted user" do
      let(:mail) { CompetitionsMailer.registration_reminder(competition, competitor, true) }

      it "says the user is registered" do
        expect(mail.body.encoded).to match(/This is a reminder that registration/)
        expect(mail.body.encoded).to match(/You have registered/)
        expect(mail.body.encoded).to include(competition_url(competition))
      end
    end
  end
end
