# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Competition do
  it "defines a valid competition" do
    competition = FactoryBot.build :competition, name: "Foo: Test - 2015"
    expect(competition).to be_valid
    expect(competition.id).to eq "FooTest2015"
    expect(competition.name).to eq "Foo: Test - 2015"
    expect(competition.cellName).to eq "Foo: Test - 2015"
  end

  it "rejects invalid names" do
    [
      "foo (Test) - 2015",
      "Poly^3 2016",
      "HOOAH! SMA 2015",
      "Campeonato de Cubos Mágicos de São Carlos/SP 2013",
      "Moldavian Nationals – Winter 2016",
      "PingSkills Cubing Classic, 2016",
    ].each do |name|
      expect(FactoryBot.build(:competition, name: name)).to be_invalid_with_errors(
        name: ["must end with a year and must contain only alphanumeric characters, dashes(-), ampersands(&), periods(.), colons(:), apostrophes('), and spaces( )"],
      )
    end
  end

  it "rejects invalid city names" do
    city = "San Diego"
    expect(FactoryBot.build(:competition, countryId: "USA", cityName: city)).to be_invalid_with_errors(
      cityName: ["is not of the form 'city, state'"],
    )

    city = "San Diego, California"
    expect(FactoryBot.build(:competition, countryId: "USA", cityName: city)).to be_valid
  end

  context "when there is an entry fee" do
    it "correctly identifies there is a fee when there is only a base fee" do
      competition = FactoryBot.build :competition, name: "Foo: Test - 2015", base_entry_fee_lowest_denomination: 10
      expect(competition.has_fees?).to be true
      expect(competition.has_base_entry_fee?).to eq competition.base_entry_fee
    end

    it "correctly identifies there is a fee when there is only event fees" do
      competition = FactoryBot.create :competition, name: "Foo: Test - 2015", base_entry_fee_lowest_denomination: 0
      competition.competition_events.first.update_attribute(:fee_lowest_denomination, 100)
      expect(competition.has_base_entry_fee?).to be nil
      expect(competition.has_fees?).to be true
    end
  end

  context "when competition has a competitor limit" do
    it "requires competitor limit to be a number" do
      competition = FactoryBot.build :competition, competitor_limit_enabled: true
      expect(competition).to be_invalid_with_errors(competitor_limit: ["is not a number"])
    end

    it "requires competitor limit to be greater than 0" do
      competition = FactoryBot.build :competition, competitor_limit_enabled: true, competitor_limit: 0, competitor_limit_reason: 'Because'
      expect(competition).to be_invalid_with_errors(competitor_limit: ["must be greater than or equal to 1"])
    end

    it "requires competitor limit to be less than 5001" do
      competition = FactoryBot.build :competition, competitor_limit_enabled: true, competitor_limit: 5001, competitor_limit_reason: 'Because'
      expect(competition).to be_invalid_with_errors(competitor_limit: ["must be less than or equal to 5000"])
    end

    it "requires a competitor limit reason" do
      competition = FactoryBot.build :competition, competitor_limit_enabled: true, competitor_limit: 100
      expect(competition).to be_invalid_with_errors(competitor_limit_reason: ["can't be blank"])
    end
  end

  context "delegates" do
    it "delegates for future comps must be current delegates" do
      competition = FactoryBot.build :competition, :with_delegate, :future
      competition.delegates.first.update_columns(delegate_status: nil)

      expect(competition).to be_invalid_with_errors(delegate_ids: ["are not all Delegates"])
    end

    it "delegates for past comps no longer need to be delegates" do
      competition = FactoryBot.build :competition, :with_delegate, :past
      competition.delegates.first.update_columns(delegate_status: nil, senior_delegate_id: nil)

      expect(competition).to be_valid
    end
  end

  it "handles missing start/end_date" do
    competition = FactoryBot.build :competition, start_date: nil, end_date: nil
    competition2 = FactoryBot.build :competition, start_date: nil, end_date: nil
    expect(competition.is_probably_over?).to be false
    expect(competition.started?).to be false
    expect(competition.in_progress?).to be false
    expect(competition.dangerously_close_to?(competition2)).to be false
  end

  it "requires that registration_open be before registration_close" do
    competition = FactoryBot.build :competition, name: "Foo Test 2015", registration_open: 1.week.ago, registration_close: 2.weeks.ago, use_wca_registration: true
    expect(competition).to be_invalid_with_errors(registration_close: ["registration close must be after registration open"])
  end

  it "requires registration_open if use_wca_registration" do
    competition = FactoryBot.build :competition, name: "Foo Test 2015", registration_open: nil, registration_close: 2.weeks.ago, use_wca_registration: true
    expect(competition).to be_invalid_with_errors(registration_open: ["required"])
  end

  it "requires registration_close if use_wca_registration" do
    competition = FactoryBot.build :competition, name: "Foo Test 2015", registration_open: 1.week.ago, registration_close: nil, use_wca_registration: true
    expect(competition).to be_invalid_with_errors(registration_close: ["required"])
  end

  it "truncates name as necessary to produce id and cellName" do
    competition = FactoryBot.build :competition, name: "Alexander and the Terrible Horrible No Good 2015"
    expect(competition).to be_valid
    expect(competition.id).to eq "AlexanderandtheTerribleHorri2015"
    expect(competition.name).to eq "Alexander and the Terrible Horrible No Good 2015"
    expect(competition.cellName).to eq "Alexander and the Terrib... 2015"
  end

  it "saves without losing data" do
    competition = FactoryBot.create :competition
    json_data = competition.as_json
    competition.save
    expect(competition.as_json).to eq json_data
  end

  it "requires that name end in a year" do
    competition = FactoryBot.build :competition, name: "Name without year"
    expect(competition).to be_invalid_with_errors(
      name: ["must end with a year and must contain only alphanumeric characters, dashes(-), ampersands(&), periods(.), colons(:), apostrophes('), and spaces( )"],
    )
  end

  it "requires that cellName end in a year" do
    competition = FactoryBot.build :competition, cellName: "Name no year"
    expect(competition).to be_invalid_with_errors(cellName: ["must end with a year and must contain only alphanumeric characters, dashes(-), ampersands(&), periods(.), colons(:), apostrophes('), and spaces( )"])
  end

  it "populates year, month, day, endYear, endMonth, endDay" do
    competition = FactoryBot.create :competition
    competition.start_date = "1987-12-31"
    competition.end_date = "1988-01-01"
    competition.save!
    expect(competition.year).to eq 1987
    expect(competition.month).to eq 12
    expect(competition.day).to eq 31
    expect(competition.endYear).to eq 1988
    expect(competition.endMonth).to eq 1
    expect(competition.endDay).to eq 1
  end

  describe "invalid date formats become nil" do
    let(:competition) { FactoryBot.create :competition }

    it "start_date" do
      competition.start_date = "i am not a date"
      expect(competition.start_date).to eq nil
    end

    it "end_date" do
      competition.end_date = "i am also not a date"
      expect(competition.end_date).to eq nil
    end
  end

  it "requires that both dates are empty or both are valid" do
    competition = FactoryBot.create :competition
    expect(competition).to be_valid

    competition.start_date = "1987-12-04"
    competition.end_date = ""
    expect(competition).to be_invalid_with_errors(end_date: ["invalid"])

    competition.end_date = "1987-12-05"
    expect(competition).to be_valid
  end

  it "requires that the start is before the end" do
    competition = FactoryBot.create :competition
    competition.start_date = "1987-12-06"
    competition.end_date = "1987-12-05"
    expect(competition).to be_invalid_with_errors(end_date: ["End date cannot be before start date."])
  end

  it "last less than MAX_SPAN_DAYS days" do
    competition = FactoryBot.create :competition
    competition.start_date = 1.days.ago.strftime("%F")
    competition.end_date = Competition::MAX_SPAN_DAYS.days.from_now.strftime("%F")
    expect(competition).to be_invalid_with_errors(
      end_date: [I18n.t('competitions.errors.span_too_many_days', max_days: Competition::MAX_SPAN_DAYS)],
    )
  end

  it "requires competition name is not greater than 50 characters" do
    competition = FactoryBot.build :competition, name: "A really long competition name that is greater than 50 characters 2016"
    expect(competition).to be_invalid_with_errors(
      name: ["is too long (maximum is 50 characters)"],
    )
  end

  context "#user_should_post_delegate_report?" do
    it "warns for unposted reports" do
      competition = FactoryBot.create :competition, :visible, :with_delegate, starts: 2.days.ago
      delegate = competition.delegates.first
      expect(competition.user_should_post_delegate_report?(delegate)).to eq true
    end

    it "does not warn for posted reports" do
      competition = FactoryBot.create :competition, :visible, :with_delegate, starts: 2.days.ago
      competition.delegate_report.update_attributes!(schedule_url: "http://example.com", posted: true)
      delegate = competition.delegates.first
      expect(competition.user_should_post_delegate_report?(delegate)).to eq false
    end

    it "does not warn for upcoming competitions" do
      competition = FactoryBot.create :competition, :visible, :with_delegate, starts: 1.days.from_now
      delegate = competition.delegates.first
      expect(competition.user_should_post_delegate_report?(delegate)).to eq false
    end

    it "does not warn board members" do
      competition = FactoryBot.create :competition, :visible, :with_delegate, starts: 2.days.ago
      board_member = FactoryBot.create :user, :board_member
      expect(competition.user_should_post_delegate_report?(board_member)).to eq false
    end
  end

  context "warnings_for" do
    it "warns if competition name is greater than 32 characters and it's not publicly visible" do
      competition = FactoryBot.build :competition, name: "A really long competition name 2016", showAtAll: false
      expect(competition).to be_valid
      expect(competition.warnings_for(nil)[:name]).to eq "The competition name is longer than 32 characters. We prefer shorter ones and we will be glad if you change it."
    end

    it "does not warn about name greater than 32 when competition is publicly visible" do
      competition = FactoryBot.build :competition, :confirmed, :visible, name: "A really long competition name 2016"
      expect(competition).to be_valid
      expect(competition.warnings_for(nil)[:name]).to eq nil
    end

    it "warns if competition is not visible" do
      competition = FactoryBot.build :competition, showAtAll: false
      expect(competition).to be_valid
      expect(competition.warnings_for(nil)[:invisible]).to eq "This competition is not visible to the public."
    end

    it "warns if competition has no events" do
      competition = FactoryBot.build :competition, events: []
      expect(competition).to be_valid
      expect(competition.warnings_for(nil)[:events]).to eq "Please add at least one event before confirming the competition."
    end
  end

  context "info_for" do
    it "displays info if competition is finished but results aren't posted" do
      competition = FactoryBot.build :competition, starts: 1.month.ago
      expect(competition).to be_valid
      expect(competition.is_probably_over?).to be true
      expect(competition.results_posted?).to be false
      expect(competition.info_for(nil)[:upload_results]).to eq "This competition is over, we are working to upload the results as soon as possible!"
    end

    it "displays info if competition is in progress" do
      competition = FactoryBot.build :competition, :ongoing
      expect(competition).to be_valid
      expect(competition.in_progress?).to be true
      expect(competition.info_for(nil)[:in_progress]).to eq "This competition is ongoing. Come back after #{I18n.l(competition.end_date, format: :long)} to see the results!"

      competition.results_posted_at = Time.now
      expect(competition.in_progress?).to be false
      expect(competition.info_for(nil)[:in_progress]).to eq nil
    end
  end

  context "competition with results posted" do
    let!(:competition) { FactoryBot.create :competition, :ongoing, :results_posted }

    it "in_progress? is false" do
      expect(competition.in_progress?).to be false
    end

    it "over scope does include the competition" do
      expect(Competition.over.find_by_id(competition.id)).to eq competition
    end

    it "not_over scope does not include the competition" do
      expect(Competition.not_over.find_by_id(competition.id)).to eq nil
    end
  end

  it "knows the calendar" do
    competition = FactoryBot.create :competition
    competition.start_date = "1987-0-04"
    expect(competition.start_date).to eq nil
  end

  it "gracefully handles multiyear competitions" do
    competition = FactoryBot.create :competition
    competition.start_date = "1987-11-06"
    competition.end_date = "1988-12-07"
    competition.save
    expect(competition).to be_invalid_with_errors(end_date: ["Competition cannot last more than 6 days."])
    expect(competition.end_date).to eq Date.parse("1988-12-07")
  end

  it "converts microdegrees to degrees" do
    competition = FactoryBot.build :competition, latitude: 40, longitude: 30
    expect(competition.latitude_degrees).to eq 40/1e6
    expect(competition.longitude_degrees).to eq 30/1e6
  end

  it "converts degrees to microdegrees when saving" do
    competition = FactoryBot.create :competition
    competition.latitude_degrees = 3.5
    competition.longitude_degrees = 4.6
    competition.save!
    expect(competition.latitude).to eq 3.5*1e6
    expect(competition.longitude).to eq 4.6*1e6
  end

  it "ensures all attributes are defined as either cloneable or uncloneable" do
    expect(Competition.column_names).to match_array(Competition::CLONEABLE_ATTRIBUTES + Competition::UNCLONEABLE_ATTRIBUTES)
  end

  describe "validates internal website" do
    it "likes http://foo.com" do
      competition = FactoryBot.build :competition, external_website: "http://foo.com"
      expect(competition).to be_valid
    end

    it "dislikes [{foo}{http://foo.com}]" do
      competition = FactoryBot.build :competition, external_website: "[{foo}{http://foo.com}]"
      expect(competition).not_to be_valid
    end

    it "dislikes htt://foo" do
      competition = FactoryBot.build :competition, external_website: "htt://foo"
      expect(competition).not_to be_valid
    end

    it "doesn't valitate if the inernal website is used" do
      competition = FactoryBot.build :competition, external_website: "", generate_website: true
      expect(competition).to be_valid
    end
  end

  it "saves delegate_ids" do
    delegate1 = FactoryBot.create(:delegate, name: "Daniel", email: "daniel@d.com")
    delegate2 = FactoryBot.create(:delegate, name: "Chris", email: "chris@c.com")
    delegates = [delegate1, delegate2]
    delegate_ids = delegates.map(&:id).join(",")
    competition = FactoryBot.create :competition, delegate_ids: delegate_ids
    expect(competition.delegates.sort_by(&:name)).to eq delegates.sort_by(&:name)
  end

  it "saves organizer_ids" do
    organizer1 = FactoryBot.create(:user, name: "Bob", email: "bob@b.com")
    organizer2 = FactoryBot.create(:user, name: "Jane", email: "jane@j.com")
    organizers = [organizer1, organizer2]
    organizer_ids = organizers.map(&:id).join(",")
    competition = FactoryBot.create :competition, organizer_ids: organizer_ids
    expect(competition.organizers.sort_by(&:name)).to eq organizers.sort_by(&:name)
  end

  describe "adding/removing events" do
    let(:two_by_two) { Event.find "222" }
    let(:three_by_three) { Event.find "333" }
    let(:competition) { FactoryBot.create(:competition, use_wca_registration: true, events: [two_by_two, three_by_three]) }

    it "removes registrations when event is removed" do
      r = FactoryBot.create(:registration, competition: competition, competition_events: competition.competition_events)

      expect(RegistrationCompetitionEvent.count).to eq 2
      competition.competition_events.joins(:event).find_by(event: two_by_two).destroy!
      expect(RegistrationCompetitionEvent.count).to eq 1

      r.reload
      expect(r.events).to match_array [three_by_three]
    end
  end

  describe "when changing the id of a competition" do
    let(:competition) { FactoryBot.create(:competition, :with_delegate, :with_organizer, use_wca_registration: true) }

    it "changes the competition_id of registrations" do
      reg1 = FactoryBot.create(:registration, competition_id: competition.id)
      competition.update_attribute(:id, "NewID2015")
      expect(reg1.reload.competition_id).to eq "NewID2015"
    end

    it "changes the competitionId of results" do
      r1 = FactoryBot.create(:result, competitionId: competition.id)
      r2 = FactoryBot.create(:result, competitionId: competition.id)
      competition.update_attribute(:id, "NewID2015")
      expect(r1.reload.competitionId).to eq "NewID2015"
      expect(r2.reload.competitionId).to eq "NewID2015"
    end

    it "changes the competitionId of scrambles" do
      scramble1 = FactoryBot.create(:scramble, competitionId: competition.id)
      competition.update_attribute(:id, "NewID2015")
      expect(scramble1.reload.competitionId).to eq "NewID2015"
    end

    it "can set competition_events_attributes" do
      comp_events = competition.competition_events

      # Force ActiveRecord to do database queries for the associated competition_events
      # with the new competition id.
      competition.reload

      old_events = competition.events
      competition.update_attributes!(
        id: "MyerComp2016",
        competition_events_attributes: [
          { "id"=> comp_events[0].id, "event_id"=>comp_events[0].event_id, "_destroy"=>"0" },
          { "id"=> comp_events[1].id, "event_id"=>comp_events[1].event_id, "_destroy"=>"0" },
        ],
      )
      new_events = competition.events
      expect(new_events).to eq old_events
    end

    it "updates the competition_id of competition_delegates and competition_organizers" do
      organizer = competition.organizers.first
      delegate = competition.delegates.first

      expect(CompetitionDelegate.where(delegate_id: delegate.id).count).to eq 1
      expect(CompetitionOrganizer.where(organizer_id: organizer.id).count).to eq 1

      cd = CompetitionDelegate.find_by_delegate_id(delegate.id)
      expect(cd).not_to eq nil
      co = CompetitionOrganizer.find_by_organizer_id(organizer.id)
      expect(co).not_to eq nil

      c = Competition.find(competition.id)
      c.id = "NewID2015"
      c.save!

      expect(CompetitionDelegate.where(delegate_id: delegate.id).count).to eq 1
      expect(CompetitionOrganizer.where(organizer_id: organizer.id).count).to eq 1
      expect(CompetitionDelegate.find(cd.id).competition_id).to eq "NewID2015"
      expect(CompetitionOrganizer.find(co.id).competition_id).to eq "NewID2015"
    end
  end

  describe "when deleting a competition" do
    it "deletes delegates" do
      delegate1 = FactoryBot.create(:delegate)
      delegates = [delegate1]
      competition = FactoryBot.create :competition, delegates: delegates

      cd = CompetitionDelegate.where(competition_id: competition.id, delegate_id: delegate1.id).first
      expect(cd).not_to be_nil
      competition.destroy
      expect(CompetitionDelegate.find_by_id(cd.id)).to be_nil
    end

    it "deletes organizers" do
      organizer1 = FactoryBot.create(:delegate)
      organizers = [organizer1]
      competition = FactoryBot.create :competition, organizers: organizers

      cd = CompetitionOrganizer.where(competition_id: competition.id, organizer_id: organizer1.id).first
      expect(cd).not_to be_nil
      competition.destroy
      expect(CompetitionOrganizer.find_by_id(cd.id)).to be_nil
    end

    it "deletes registrations" do
      registration = FactoryBot.create(:registration)
      registration.competition.destroy
      expect(Registration.find_by_id(registration.id)).to be_nil
    end
  end

  describe "when confirming or making visible" do
    let(:competition_with_delegate) { FactoryBot.build :competition, :with_delegate, generate_website: false }
    let(:competition_without_delegate) { FactoryBot.build :competition }

    [:confirmed, :showAtAll].each do |action|
      it "can set #{action}" do
        competition_with_delegate.public_send "#{action}=", true
        expect(competition_with_delegate).to be_valid
      end

      [:cityName, :countryId, :venue, :venueAddress, :external_website, :latitude, :longitude].each do |field|
        it "requires #{field} when setting #{action}" do
          competition_with_delegate.assign_attributes field => "", action => true
          expect(competition_with_delegate).not_to be_valid
        end
      end

      it "must have at least one event when setting #{action}" do
        competition_with_delegate.assign_attributes events: [], action => true
        expect(competition_with_delegate).not_to be_valid
      end

      it "requires both dates when setting #{action}" do
        competition_with_delegate.assign_attributes start_date: "", end_date: "", action => true
        expect(competition_with_delegate).not_to be_valid
      end

      it "requires at least one delegate when setting #{action}" do
        competition_without_delegate.public_send "#{action}=", true
        expect(competition_without_delegate).not_to be_valid
      end
    end

    it "sets confirmed_at when setting confirmed true" do
      competition = FactoryBot.create :competition, :with_delegate
      expect(competition.confirmed_at).to be_nil

      now = Time.at(Time.now.to_i)
      Timecop.freeze(now) do
        competition.update!(confirmed: true)
        expect(competition.reload.confirmed_at).to eq now
      end
    end

    it "does not update confirmed_at when confirming already confirmed competition" do
      competition = FactoryBot.create :competition, :confirmed

      confirmed_at = competition.confirmed_at
      expect(confirmed_at).not_to be_nil
      Timecop.freeze(confirmed_at + 10) do
        competition.update!(confirmed: true)
        expect(competition.reload.confirmed_at).to eq confirmed_at
      end
    end

    it "clears confirmed_at when setting confirmed false" do
      competition = FactoryBot.create :competition, :confirmed

      expect(competition.confirmed_at).not_to be_nil
      competition.update!(confirmed: false)
      expect(competition.reload.confirmed_at).to be_nil
    end
  end

  describe "receive_registration_emails" do
    let(:competition) { FactoryBot.create :competition }
    let(:delegate) { FactoryBot.create :delegate }

    it "computes receiving_registration_emails? via OR" do
      expect(competition.receiving_registration_emails?(delegate.id)).to eq false

      competition.delegates << delegate
      expect(competition.receiving_registration_emails?(delegate.id)).to eq true

      cd = competition.competition_delegates.find_by_delegate_id(delegate.id)
      cd.update_column(:receive_registration_emails, false)
      expect(competition.receiving_registration_emails?(delegate.id)).to eq false

      competition.organizers << delegate
      expect(competition.receiving_registration_emails?(delegate.id)).to eq true

      co = competition.competition_organizers.find_by_organizer_id(delegate.id)
      co.update_column(:receive_registration_emails, false)
      expect(competition.receiving_registration_emails?(delegate.id)).to eq false
    end

    it "setting receive_registration_emails" do
      competition.delegates << delegate
      cd = competition.competition_delegates.find_by_delegate_id(delegate.id)
      expect(cd.receive_registration_emails).to eq true

      competition.receive_registration_emails = false
      competition.editing_user_id = delegate.id
      competition.save!
      competition.receive_registration_emails = nil
      expect(cd.reload.receive_registration_emails).to eq false

      competition.organizers << delegate
      co = competition.competition_organizers.find_by_organizer_id(delegate.id)
      expect(co.receive_registration_emails).to eq true

      competition.receive_registration_emails = false
      competition.editing_user_id = delegate.id
      competition.save!

      expect(cd.reload.receive_registration_emails).to eq false
      expect(co.reload.receive_registration_emails).to eq false
    end
  end

  describe "results" do
    let(:three_by_three) { Event.find "333" }
    let(:two_by_two) { Event.find "222" }
    let(:competition) { FactoryBot.create :competition, events: [three_by_three, two_by_two] }

    let(:person_one) { FactoryBot.create :person, name: "One" }
    let(:person_two) { FactoryBot.create :person, name: "Two" }
    let(:person_three) { FactoryBot.create :person, name: "Three" }
    let(:person_four) { FactoryBot.create :person, name: "Four" }

    let!(:r_333_1_first) { FactoryBot.create :result, competition: competition, eventId: "333", roundTypeId: "1", pos: 1, person: person_one }
    let!(:r_333_1_second) { FactoryBot.create :result, competition: competition, eventId: "333", roundTypeId: "1", pos: 2, person: person_two }
    let!(:r_333_1_third) { FactoryBot.create :result, competition: competition, eventId: "333", roundTypeId: "1", pos: 3, person: person_three }
    let!(:r_333_1_fourth) { FactoryBot.create :result, competition: competition, eventId: "333", roundTypeId: "1", pos: 4, person: person_four }

    let!(:r_333_f_first) { FactoryBot.create :result, competition: competition, eventId: "333", roundTypeId: "f", pos: 1, person: person_one }
    let!(:r_333_f_second) { FactoryBot.create :result, competition: competition, eventId: "333", roundTypeId: "f", pos: 2, person: person_two }
    let!(:r_333_f_third) { FactoryBot.create :result, competition: competition, eventId: "333", roundTypeId: "f", pos: 3, person: person_three }

    let!(:r_222_c_second_tied) { FactoryBot.create :result, competition: competition, eventId: "222", roundTypeId: "c", pos: 1, person: person_two }
    let!(:r_222_c_first_tied) { FactoryBot.create :result, competition: competition, eventId: "222", roundTypeId: "c", pos: 1, person: person_one }

    it "events_with_podium_results" do
      result = competition.events_with_podium_results
      expect(result.size).to eq 2
      expect(result.first.first).to eq three_by_three
      expect(result.first.last.map(&:value1)).to eq [3000] * 3

      expect(result.last.first).to eq two_by_two
      expect(result.last.last.map(&:value1)).to eq [3000, 3000]
    end

    it "winning_results" do
      result = competition.winning_results
      expect(result.size).to eq 3
      expect(result.first.eventId).to eq "333"
      expect(result.first.best).to eq 3000
      expect(result.first.roundTypeId).to eq "f"

      expect(result.last.eventId).to eq "222"
      expect(result.last.best).to eq 3000
      expect(result.last.roundTypeId).to eq "c"
    end

    it "person_ids_with_results" do
      result = competition.person_ids_with_results
      expect(result.size).to eq 4
      expect(result.map(&:first)).to eq [person_four, person_one, person_three, person_two].map(&:wca_id)
      expect(result.second.last.map(&:roundTypeId)).to eq %w(f 1 c)

      expect(result[1][1][1].muted).to eq true
      expect(result[1][1][2].muted).to eq false

      expect(result[2][1][1].muted).to eq true
      expect(result[3][1][1].muted).to eq true
    end

    it "events_with_round_types_with_results" do
      results = competition.events_with_round_types_with_results
      expect(results.size).to eq 2
      expect(results[0].first).to eq three_by_three
      expect(results[0].second.first.first).to eq RoundType.find("1")
      expect(results[0].second.first.last.map(&:value1)).to eq [3000] * 4
      expect(results[0].second.first.last.map(&:eventId)).to eq ["333"] * 4
      expect(results[0].second.second.last.map(&:value1)).to eq [3000] * 3

      expect(results[1].first).to eq two_by_two
      expect(results[1].second.first.first).to eq RoundType.find("c")
      expect(results[1].second.first.last.map(&:value1)).to eq [3000, 3000]

      # Orders results which tied by person name.
      expect(results[1].second.first.last.map(&:personName)).to eq %w(One Two)
    end

    it "winning_results and events_with_podium_results don't include results with DNF as best" do
      competition.results.where(eventId: "222").update_all(best: SolveTime::DNF_VALUE)
      expect(competition.winning_results.map(&:event).uniq).to eq [three_by_three]
      expect(competition.events_with_podium_results.map(&:first).uniq).to eq [three_by_three]
    end
  end

  it "when id is changed, foreign keys are updated as well" do
    competition = FactoryBot.create(:competition, :with_delegate, :with_organizer, :with_delegate_report, :registration_open)
    FactoryBot.create(:result, competitionId: competition.id)
    FactoryBot.create(:competition_tab, competition: competition)
    FactoryBot.create(:registration, competition: competition)

    expect do
      competition.update_attribute(:id, "NewName2016")
    end.to_not change {
      [:results, :organizers, :delegates, :tabs, :registrations, :delegate_report].map do |associated|
        competition.send(associated)
      end
    }

    expect(competition).to respond_to(:update_foreign_keys),
                           "This whole test should be removed alongside update_foreign_keys callback in the Competition model."
  end

  context "when cloned competition is saved" do
    let!(:competition) { FactoryBot.create(:competition) }
    let!(:clone) do
      competition.build_clone.tap do |clone|
        clone.name = "Cloned Competition 2016"
        clone.start_date, clone.end_date = [1.month.from_now.strftime("%F")] * 2
      end
    end
    let!(:tab) { FactoryBot.create(:competition_tab, competition: competition) }

    it "tabs are cloned" do
      expect do
        clone.save
      end.to change(CompetitionTab, :count).by(1)
      cloned_tab = clone.reload.tabs.first
      expect(cloned_tab).to_not eq tab
      expect(cloned_tab.name).to eq tab.name
      expect(cloned_tab.content).to eq tab.content
    end

    it "tabs are not cloned if clone_tabs is set to false" do
      clone.clone_tabs = false
      clone.save
      expect(clone.tabs).to be_empty
    end
  end

  context "website" do
    let!(:competition) { FactoryBot.build(:competition, id: "Competition2016", external_website: "https://external.website.com") }

    it "returns the internal url if WCA website is used as competition's one" do
      competition.generate_website = true
      expect(competition.website).to end_with "Competition2016"
    end

    it "returns external url if WCA website is not used as competitin's one" do
      expect(competition.website).to eq "https://external.website.com"
    end
  end

  context "competitors" do
    let!(:competition) { FactoryBot.create(:competition) }

    it "works" do
      FactoryBot.create_list :result, 2, competition: competition
      expect(competition.competitors.count).to eq 2
    end

    it "handles competitors with multiple subIds" do
      person_with_sub_ids = FactoryBot.create :person_with_multiple_sub_ids
      FactoryBot.create :result, competition: competition, person: person_with_sub_ids
      FactoryBot.create :result, competition: competition
      expect(competition.competitors.count).to eq 2
    end
  end

  describe "#contains" do
    let!(:delegate) { FactoryBot.create :delegate, name: 'Pedro' }
    let!(:search_comp) { FactoryBot.create :competition, name: "Awesome Comp 2016", cityName: "Piracicaba", countryId: "Brazil", delegates: [delegate] }
    it "searching with two words" do
      expect(Competition.contains('eso').contains('aci').first).to eq search_comp
      expect(Competition.contains('awesome').contains('comp').first).to eq search_comp
      expect(Competition.contains('abc').contains('def').first).to eq nil
      expect(Competition.contains('ped').contains('aci').first).to eq nil
      expect(Competition.contains('wes').contains('blah').first).to eq nil
    end
  end

  describe "#managed_by" do
    let(:delegate1) { FactoryBot.create(:delegate) }
    let(:delegate2) { FactoryBot.create(:delegate) }
    let(:organizer1) { FactoryBot.create(:user) }
    let(:organizer2) { FactoryBot.create(:user) }
    let!(:competition) {
      FactoryBot.create(:competition, :confirmed, delegates: [delegate1, delegate2], organizers: [organizer1, organizer2])
    }
    let!(:competition_without_organizers) {
      FactoryBot.create(:competition, :confirmed, delegates: [delegate1, delegate2], organizers: [])
    }
    let!(:other_comp) { FactoryBot.create(:competition) }

    it "finds comps by delegate" do
      expect(Competition.managed_by(delegate1.id)).to match_array [competition, competition_without_organizers]
    end

    it "finds comps by organizer" do
      expect(Competition.managed_by(organizer1.id)).to match_array [competition]
    end
  end

  describe "#serializable_hash" do
    let(:competition) { FactoryBot.create :competition, countryId: "" }

    it "sets iso2 to nil when country is missing" do
      expect(competition.serializable_hash[:country_iso2]).to be_nil
    end
  end
end
