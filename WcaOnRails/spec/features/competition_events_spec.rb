# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Competition events management" do
  before :each do
    # Enable CSRF protection just for these tests.
    # See https://blog.tomoyukikashiro.me/post/test-csrf-in-feature-test-using-capybara/
    allow_any_instance_of(ActionController::Base).to receive(:protect_against_forgery?).and_return(true)
  end

  context "unconfirmed competition" do
    let(:competition) { FactoryBot.create(:competition, event_ids: [], qualification_results: true, qualification_results_reason: "Because I need them for testing!") }

    background do
      sign_in FactoryBot.create(:admin)
      visit "/competitions/#{competition.id}/events/edit"

      within_event_panel("333") do
        click_button "Add event"
      end
      select_from_ui(find_event_panel("333"), "selectRoundCount", "1 round")

      save_events_react
      competition.reload
    end

    scenario "adds 1 round of 333", js: true do
      expect(competition.events.map(&:id)).to match_array %w(333)
    end

    scenario "remove event", js: true do
      within_event_panel("333") do
        click_button "Remove event"
      end

      within_modal do
        click_button "Yes"
      end

      save_events_react

      expect(competition.reload.events.map(&:id)).to eq []
    end

    # This feature set is notorious for randomly failing.
    # This may be due to our clumsy react component, or to our clumsy js driver.
    # Regardless, it's annoying to restart a whole travis job just for that,
    # so we set the retry attempts to 3.
    feature 'change round attributes' do
      let(:comp_event_333) { competition.competition_events.find_by_event_id("333") }
      let(:round_333_1) { comp_event_333.rounds.first }

      scenario "close with unsaved changes prompts user before discarding changes", js: true, retry: 3 do
        find_round("333", 1).find(".round-row__time-limit").find("button").click

        modal = find_modal
        modal.find(:css, "input[type='text']").fill_in with: "4:00.00"
        modal.click_button "Close"

        # Modal asking to discard changes.
        within_modal do
          click_button "Yes"
        end

        # Now that we discarded that change, try opening the modal again and check what value is shown.
        find_round("333", 1).find(".round-row__time-limit").find("button").click

        within_modal do
          expect(page).to have_text "Competitors have 10 minutes for each of their solves."
        end
      end

      scenario "change scramble group count to 42", js: true, retry: 3 do
        within_round("333", 1) { fill_in "scrambleSetCount", with: "42" }
        save_events_react
        expect(round_333_1.reload.scramble_set_count).to eq 42
      end

      scenario "change time limit to 5 minutes", js: true, retry: 3 do
        find_round("333", 1).find(".round-row__time-limit").find("button").click

        modal = find_modal
        modal.find(:css, "input[type='text']").fill_in with: "5:00.00"
        modal.click_button "Ok"

        save_events_react

        expect(round_333_1.reload.time_limit_to_s).to eq "5:00.00"
      end

      scenario "change cutoff to best of 2 in 2 minutes", js: true, retry: 3 do
        find_round("333", 1).find(".round-row__cutoff").find("button").click

        modal = find_modal
        select_from_ui(modal, "cutoffFormat", "Best of 2")
        modal.find("div.field", text: "Result").find("input").fill_in with: "2:00.00"
        modal.click_button "Ok"

        save_events_react

        expect(round_333_1.reload.cutoff_to_s).to eq "2 attempts to get < 2:00.00"
      end

      scenario "change advancement condition to top 12 people", js: true, retry: 3 do
        # Add a second round of 333 so we can set an advancement condition on round 1.
        event_panel = find_event_panel("333")
        select_from_ui(event_panel, "selectRoundCount", "2 rounds")

        find_round("333", 1).find(".round-row_advancementCondition").find("button").click

        modal = find_modal
        select_from_ui(modal, "advancementType", "Ranking")
        modal.find(:css, "input[type='number'][label='Ranking']").fill_in with: "12"
        modal.click_button "Ok"

        save_events_react

        expect(round_333_1.reload.advancement_condition_to_s).to eq "Top 12 advance to next round"
      end

      scenario "change qualification time to any result", js: true, retry: 3 do
        find_event_panel("333").find("[name='qualification']").click

        qualification_date = 7.days.from_now.to_date

        modal = find_modal
        select_from_ui(modal, "qualificationResultType", "Single")
        select_from_ui(modal, "qualificationType", "Any result")

        modal.find("div.field", text: "Qualification Deadline")
             .find("input")
             .fill_in with: qualification_date.strftime('%m/%d/%Y')

        modal.click_button "Ok"

        save_events_react
        comp_event_333.reload

        expect(comp_event_333.qualification_to_s).to eq "Any single solve"
        expect(comp_event_333.qualification.when_date).to eq qualification_date
      end
    end
  end

  context "confirmed competition" do
    let!(:competition) { FactoryBot.create(:competition, :confirmed, event_ids: ["222", "444"]) }

    scenario "delegate cannot add events", js: true do
      sign_in competition.delegates.first
      visit "/competitions/#{competition.id}/events/edit"
      within_event_panel("333") do
        expect(find_button("Add event", disabled: true)).to be
      end
    end

    scenario "delegate cannot remove events", js: true do
      sign_in competition.delegates.first
      visit "/competitions/#{competition.id}/events/edit"
      within_event_panel("222") do
        expect(find_button("Remove event", disabled: true)).to be
      end
    end

    scenario "board member can add events", js: true do
      sign_in FactoryBot.create(:user, :board_member)
      visit "/competitions/#{competition.id}/events/edit"
      within_event_panel("333") do
        click_button "Add event"
      end
      save_events_react

      expect(competition.reload.events.map(&:id)).to match_array %w(222 333 444)
    end

    scenario "board member can remove events", js: true do
      sign_in FactoryBot.create(:user, :board_member)
      visit "/competitions/#{competition.id}/events/edit"

      within_event_panel("444") do
        click_button "Remove event"
      end

      within_modal do
        click_button "Yes"
      end

      save_events_react

      expect(competition.reload.events.map(&:id)).to match_array %w(222)
    end

    context "even admin cannot create inconsistent competition state" do
      let(:comp_event_222) { competition.competition_events.find_by_event_id("222") }

      scenario "by deleting main event", js: true do
        sign_in FactoryBot.create(:admin)
        visit "/competitions/#{competition.id}/events/edit"

        within_event_panel("222") do
          click_button "Remove event"
        end

        within_modal do
          click_button "Yes"
        end

        save_events_react(wait_for_completion: false)

        expect(competition.reload.events.map(&:id)).to match_array %w(222 444)
      end

      scenario "by inserting a qualification when they were not originally applied for", js: true do
        sign_in FactoryBot.create(:admin)
        visit "/competitions/#{competition.id}/events/edit"

        expect(find_event_panel("222").find(:css, '[name="qualification"].disabled')).to be
      end
    end
  end

  context "competition with results posted" do
    let!(:competition) { FactoryBot.create :competition, :confirmed, :visible, :results_posted, event_ids: Event.where(id: '333') }
    let(:competition_event) { competition.competition_events.find_by_event_id("333") }

    scenario "delegate cannot update events", js: true, retry: 3 do
      FactoryBot.create :round, number: 2, format_id: 'a', competition_event: competition_event, total_number_of_rounds: 2
      sign_in competition.delegates.first
      visit "/competitions/#{competition.id}/events/edit"

      expect(find_event_panel("333").find('[name="selectRoundCount"].disabled')).to be

      round = find_round("333", 1)

      expect(round.find(".round-row__format").find("div[name='format'].disabled")).to be
      expect(round.find(".round-row__scramble-set-count").find("input").disabled?).to be
      expect(round.find(".round-row__time-limit").find("button").disabled?).to be
      expect(round.find(".round-row__cutoff").find("button").disabled?).to be
      expect(round.find(".round-row_advancementCondition").find("button").disabled?).to be
    end

    scenario "board member can update events", js: true do
      sign_in FactoryBot.create(:user, :board_member)
      visit "/competitions/#{competition.id}/events/edit"

      event_panel = find_event_panel("333")
      select_from_ui(event_panel, "selectRoundCount", "2 rounds")
      save_events_react

      expect(competition_event.reload.rounds.length).to eq 2
    end
  end
end

def find_event_panel(event_id, &)
  find(:css, ".event-panel.event-#{event_id}", &)
end

def find_round(event_id, round_number, &)
  find_event_panel(event_id).find(:css, "[name='round-#{round_number}']", &)
end

def within_event_panel(event_id, &)
  within(:css, ".event-panel.event-#{event_id}", &)
end

def within_round(event_id, round_number, &)
  within_event_panel(event_id) do
    within(:css, "[name='round-#{round_number}']", &)
  end
end

def find_modal(&)
  all(:css, '.modal.visible', &).last
end

def within_modal(&)
  within(find_modal(&))
end

def save_events_react(wait_for_completion: true)
  # Wait for the modal to be hidden.
  expect(page).to have_no_css(".modal-open")
  first(:button, "save your changes!", visible: true).click
  # Wait for ajax to complete.
  expect(page).to have_no_content("You have unsaved changes") if wait_for_completion
end

def select_from_ui(parent, name, option)
  field = parent.find(:css, "div[name='#{name}']")
  field.click
  field.find(:css, "div[role='option']", text: option).click
end
