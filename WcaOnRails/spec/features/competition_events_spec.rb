# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Competition events management" do
  let(:competition) { FactoryGirl.create(:competition, event_ids: []) }

  before :each do
    # Enable CSRF protection just for these tests.
    # See https://blog.tomoyukikashiro.me/post/test-csrf-in-feature-test-using-capybara/
    allow_any_instance_of(ActionController::Base).to receive(:protect_against_forgery?).and_return(true)
  end

  background do
    sign_in FactoryGirl.create(:admin)
    visit "/competitions/#{competition.id}/events/edit"
    within_event_panel("333") { select("1 round", from: "select-round-count") }
    save
    competition.reload
  end

  scenario "adds 1 round of 333", js: true do
    expect(competition.events.map(&:id)).to match_array %w(333)
  end

  feature 'change round attributes' do
    let(:comp_event_333) { competition.competition_events.find_by_event_id("333") }
    let(:round_333_1) { comp_event_333.rounds.first }

    scenario "change to best of 3", js: true do
      within_round("333", 1) { select("Bo3", from: "format") }
      save
      expect(round_333_1.reload.format.id).to eq "3"
    end

    scenario "change time limit to 5 minutes", js: true do
      within_round("333", 1) { find("[name=timeLimit]").click }

      within_modal do
        fill_in "minutes", with: "5"
        click_button "Save"
      end
      save

      expect(round_333_1.reload.time_limit).to eq TimeLimit.new(centiseconds: 5.minutes.in_centiseconds, cumulative_round_ids: [])
      expect(round_333_1.reload.time_limit.to_s(round_333_1)).to eq "5:00.00"
    end

    scenario "change cutoff to best of 2 in 2 minutes", js: true do
      within_round("333", 1) { find("[name=cutoff]").click }

      within_modal do
        select "Best of 2", from: "Round format"
        fill_in "minutes", with: "2"
        click_button "Save"
      end
      save

      expect(round_333_1.reload.cutoff.to_s(round_333_1)).to eq "2 attempts to get ≤ 2:00.00"
    end

    scenario "change advancement condition to top 12 people", js: true do
      # Add a second round of 333 so we can set an advancement condition on round 1.
      within_event_panel("333") { select("2 rounds", from: "select-round-count") }

      within_round("333", 1) { find("[name=advancementCondition]").click }

      within_modal do
        select "Ranking", from: "Type"
        fill_in "Ranking", with: "12"
        click_button "Save"
      end
      save

      expect(round_333_1.reload.advancement_condition.to_s(round_333_1)).to eq "Top 12 advance to round 2"
    end
  end
end

def within_event_panel(event_id)
  within(:css, ".panel.event-#{event_id}") do
    yield
  end
end

def within_round(event_id, round_number)
  within_event_panel(event_id) do
    within(:css, ".round-1") do
      yield
    end
  end
end

def within_modal
  within(:css, '.modal-content') do
    yield
  end
end

def save
  first(:button, "save your changes!", visible: true).click
  # Wait for ajax to complete.
  expect(page).to have_no_content("You have unsaved changes")
end
