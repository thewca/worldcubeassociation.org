# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Competition events management" do
  before :each do
    # Enable CSRF protection just for these tests.
    # See https://blog.tomoyukikashiro.me/post/test-csrf-in-feature-test-using-capybara/
    allow_any_instance_of(ActionController::Base).to receive(:protect_against_forgery?).and_return(true)
  end

  context "unconfirmed competition" do
    let(:competition) { FactoryBot.create(:competition, event_ids: []) }

    background do
      sign_in FactoryBot.create(:admin)
      visit "/competitions/#{competition.id}/events/edit"
      within_event_panel("333") do
        click_button "Add event"
        select("1 round", from: "selectRoundCount")
      end
      save
      competition.reload
    end

    scenario "adds 1 round of 333", js: true do
      expect(competition.events.map(&:id)).to match_array %w(333)
    end

    scenario "remove event", js: true do
      within_event_panel("333") do
        click_button "Remove event"
        accept_alert "Are you sure you want to remove all 1 round of 3x3x3 Cube?"
      end
      save
      competition.reload

      expect(competition.events.map(&:id)).to eq []
    end

    feature 'change round attributes' do
      let(:comp_event_333) { competition.competition_events.find_by_event_id("333") }
      let(:round_333_1) { comp_event_333.rounds.first }

      scenario "close with unsaved changes prompts user before discarding changes", js: true do
        within_round("333", 1) { find("[name=timeLimit]").click }

        page.accept_confirm "Are you sure you want to discard your changes?" do
          within_modal do
            fill_in "minutes", with: "4"
            click_button "Close"
          end
        end

        # Now that we discarded that change, try opening the modal again and check what value is shown.
        within_round("333", 1) { find("[name=timeLimit]").click }
        within_modal do
          expect(page).to have_text "Competitors have 10 minutes for each of their solves."
        end
      end

      scenario "change to best of 3", js: true do
        within_round("333", 1) { select("Bo3", from: "format") }
        save
        expect(round_333_1.reload.format.id).to eq "3"
      end

      scenario "change scramble group count to 42", js: true do
        within_round("333", 1) { fill_in("scrambleSetCount", with: 42) }
        save
        expect(round_333_1.reload.scramble_set_count).to eq 42
      end

      scenario "change time limit to 5 minutes", js: true do
        within_round("333", 1) { find("[name=timeLimit]").click }

        within_modal do
          fill_in "minutes", with: "5"
          click_button "Ok"
        end
        save

        expect(round_333_1.reload.time_limit_to_s).to eq "5:00.00"
      end

      scenario "change cutoff to best of 2 in 2 minutes", js: true do
        within_round("333", 1) { find("[name=cutoff]").click }

        within_modal do
          select "Best of 2", from: "Cutoff format"
          fill_in "minutes", with: "2"
          click_button "Ok"
        end
        save

        expect(round_333_1.reload.cutoff_to_s).to eq "2 attempts to get < 2:00.00"
      end

      scenario "change advancement condition to top 12 people", js: true do
        # Add a second round of 333 so we can set an advancement condition on round 1.
        within_event_panel("333") { select("2 rounds", from: "selectRoundCount") }

        within_round("333", 1) { find("[name=advancementCondition]").click }

        within_modal do
          select "Ranking", from: "Type"
          fill_in "Ranking", with: "12"
          click_button "Ok"
        end
        save

        expect(round_333_1.reload.advancement_condition_to_s).to eq "Top 12 advance to round 2"
      end
    end
  end

  context "confirmed competition" do
    let(:competition) { FactoryBot.create(:competition, :confirmed, event_ids: ["222", "444"]) }

    scenario "delegate cannot add events", js: true do
      sign_in competition.delegates.first
      visit "/competitions/#{competition.id}/events/edit"
      within_event_panel("333") do
        expect(find_button("Add event", disabled: true)).not_to be_nil
      end
    end

    scenario "delegate cannot remove events", js: true do
      sign_in competition.delegates.first
      visit "/competitions/#{competition.id}/events/edit"
      within_event_panel("222") do
        expect(find_button("Remove event", disabled: true)).not_to be_nil
      end
    end

    scenario "board member can add events", js: true do
      sign_in FactoryBot.create(:user, :board_member)
      visit "/competitions/#{competition.id}/events/edit"
      within_event_panel("333") do
        click_button "Add event"
      end
      save
      competition.reload

      expect(competition.events.map(&:id)).to match_array %w(222 333 444)
    end

    scenario "board member can remove events", js: true do
      sign_in FactoryBot.create(:user, :board_member)
      visit "/competitions/#{competition.id}/events/edit"

      within_event_panel("222") do
        click_button "Remove event"
      end
      save
      competition.reload

      expect(competition.events.map(&:id)).to match_array %w(444)
    end
  end
end

def within_event_panel(event_id, &block)
  within(:css, ".panel.event-#{event_id}", &block)
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
