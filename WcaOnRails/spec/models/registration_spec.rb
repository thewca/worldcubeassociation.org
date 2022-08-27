# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Registration do
  let(:registration) { FactoryBot.create :registration }

  it "defines a valid registration" do
    expect(registration).to be_valid
  end

  it "requires a competition_id" do
    registration.competition_id = nil
    expect(registration).not_to be_valid
    expect(registration.errors.messages[:competition]).to eq ["Competition not found"]
  end

  it "requires a valid competition_id" do
    registration.competition_id = "foobar"
    expect(registration).not_to be_valid
    expect(registration.errors.messages[:competition]).to eq ["Competition not found"]
  end

  it "allows no user on update" do
    registration.user_id = nil
    expect(registration).to be_valid
  end

  describe "on create" do
    let(:registration) { FactoryBot.build :registration }

    it "requires user on create" do
      expect(FactoryBot.build(:registration, user_id: nil)).to be_invalid_with_errors(user: ["can't be blank"])
    end

    it "requires user country" do
      user = FactoryBot.create(:user, country_iso2: nil)
      registration.user = user
      expect(registration).to be_invalid_with_errors(user_id: ["Need a country"])
    end

    it "requires user gender" do
      user = FactoryBot.create(:user, gender: nil)
      registration.user = user
      expect(registration).to be_invalid_with_errors(user_id: ["Need a gender"])
    end

    it "requires user dob" do
      user = FactoryBot.create(:user, dob: nil)
      registration.user = user
      expect(registration).to be_invalid_with_errors(user_id: ["Need a birthdate"])
    end

    it "requires user not banned" do
      user = FactoryBot.create(:user, :banned)
      registration.user = user
      expect(registration).to be_invalid_with_errors(user_id: [I18n.t('registrations.errors.banned_html').html_safe])
    end
  end

  it "doesn't invalidate existing registration when the competitor is banned" do
    user = FactoryBot.create(:user, :banned)
    registration.user = user
    expect(registration).to be_valid
  end

  it "allows deleting a registration of a banned competitor" do
    user = FactoryBot.create(:user, :banned)
    registration.user = user
    registration.save!
    registration.deleted_at = Time.now
    expect(registration).to be_valid
  end

  it "doesn't allow undeleting a registration of a banned competitor" do
    user = FactoryBot.create(:user, :banned)
    registration.user = user
    registration.deleted_at = Time.now
    registration.save!
    registration.deleted_at = nil
    expect(registration).to be_invalid_with_errors(user_id: [I18n.t('registrations.errors.undelete_banned')])
  end

  it "requires at least one event" do
    registration.registration_competition_events = []
    expect(registration).to be_invalid_with_errors(registration_competition_events: ["must register for at least one event"])
  end

  it "requires events be offered by competition" do
    registration.registration_competition_events.build(competition_event_id: 1234)
    expect(registration).to be_invalid_with_errors(
      "registration_competition_events.competition_event" => ["can't be blank"],
    )
  end

  it "handles a changing user" do
    registration.user.update_column(:name, "New Name")
    expect(registration.name).to eq "New Name"
  end

  it "requires quests >= 0" do
    registration.guests = -5
    expect(registration).to be_invalid_with_errors(guests: ["must be greater than or equal to 0"])
  end

  context "when the competition is part of a series" do
    let!(:series) { FactoryBot.create :competition_series, name: "Registration Test Series 2015" }

    let!(:partner_competition) {
      FactoryBot.create :competition, latitude: registration.competition.latitude, longitude: registration.competition.longitude,
                                      start_date: registration.competition.start_date, end_date: registration.competition.end_date,
                                      competition_series: series
    }
    let!(:partner_registration) { FactoryBot.create :registration, :pending, competition: partner_competition, user: registration.user }

    before { registration.competition.update!(competition_series: series) }

    it "does allow multiple pending registrations for one competitor" do
      expect(registration).to be_valid
      expect(partner_registration).to be_valid
    end

    context "and one registration is accepted" do
      before { registration.update!(accepted_at: Time.now) }

      it "does allow accepting when the other registration is pending" do
        expect(registration).to be_valid
        expect(partner_registration).to be_valid
      end

      it "does allow accepting when the other registration is deleted" do
        expect(registration).to be_valid

        partner_registration.deleted_at = Time.now
        expect(partner_registration).to be_valid
      end

      it "doesn't allow accepting when the other registration is confirmed" do
        expect(registration).to be_valid

        partner_registration.accepted_at = Time.now
        expect(partner_registration).to be_invalid_with_errors(competition_id: [I18n.t('registrations.errors.series_more_than_one_accepted')])
      end
    end
  end
end
