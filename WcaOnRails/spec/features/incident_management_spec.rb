# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Incident Management", js: true do
  let!(:incident1) { FactoryBot.create(:incident, title: "First incident", tags: ["a", "b"], incident_competitions_attributes: { '0': { competition_id: FactoryBot.create(:competition, :confirmed).id } }) }
  let!(:incident2) { FactoryBot.create(:incident, :resolved, title: "Second incident", tags: ["a", "c", "1a"]) }
  let!(:incident3) { FactoryBot.create(:incident, :resolved, title: "Custom title", tags: ["c"]) }

  context "when signed in as a WRC member" do
    let(:wrc_member) { FactoryBot.create(:user, :wrc_member) }
    before(:each) do
      sign_in wrc_member
    end

    feature "list of incidents" do
      scenario "shows all" do
        visit "/incidents"
        expect(page).to have_content("First incident")
        expect(page).to have_content("Custom title")
        expect(page).to have_content("Second incident")
      end

      scenario "filters by tag" do
        visit "/incidents?tags=b"
        page.find("#incident-tags", visible: false).has_content?("b")
        expect(page).to have_content("First incident")
        expect(page).to have_no_content("Custom title")
        expect(page).to have_no_content("Second incident")
      end

      scenario "filters by text" do
        visit "/incidents"
        within(:css, ".incidents-log-table-container") do
          fill_in "Search", with: "Custom"
        end
        expect(page).to have_content("Custom title")
        expect(page).to have_no_content("First incident")
      end

      scenario "filters by both" do
        visit "/incidents?tags=c&search=Custom"
        page.find("#incident-tags", visible: false).has_content?("c")
        expect(page).to have_content("Custom title")
        expect(page).to have_no_content("Second incident")
      end

      scenario "shows regulation text" do
        visit "/incidents"
        page.find(".incident-tag", text: "1a").click
        # Unfortunately we don't have access to the Regulations json within travis,
        # so here we check for the most unlikely to change Regulation:
        # that a competition must include a WCA Delegate.
        expect(page).to have_content("must include a WCA Delegate")
      end
    end

    feature "create an incident" do
      scenario "renders errors" do
        visit new_incident_path
        click_button "Create Incident"
        expect(page).to have_text("Title can't be blank")
      end
    end

    feature "show an incident" do
      scenario "shows all information" do
        visit incident_path(incident1)
        expect(page).to have_content("First incident")
        expect(page).to have_content(incident1.competitions.map(&:id).join(" "))
        expect(page).to have_content(incident1.tags_array.join(" "))
        expect(page).to have_content(incident1.public_summary)
        expect(page).to have_content(incident1.private_description)
        expect(page).to have_content(incident1.private_wrc_decision)
      end
    end
  end

  context "when signed in as a Delegate" do
    let(:delegate) { FactoryBot.create(:delegate) }
    before(:each) do
      sign_in delegate
    end

    feature "shows incidents log" do
      scenario "shows all incidents" do
        visit "/incidents"
        expect(page).to have_content("First incident")
        expect(page).to have_content("Custom title")
        expect(page).to have_content("Second incident")
      end
    end

    feature "show an incident" do
      scenario "shows all information when resolved" do
        visit incident_path(incident3)
        expect(page).to have_content(incident3.title)
        expect(page).to have_content(incident3.tags_array.join(" "))
        expect(page).to have_content(incident3.public_summary)
        expect(page).to have_content(incident3.private_description)
        expect(page).to have_content(incident3.private_wrc_decision)
      end

      scenario "shows only delegate information when pending" do
        visit incident_path(incident1)
        expect(page).to have_content(incident3.public_summary)
        expect(page).to have_content(incident3.private_description)
        expect(page).to have_no_content(incident3.private_wrc_decision)
      end
    end
  end

  context "when signed in as a User" do
    let(:user) { FactoryBot.create(:user) }
    before(:each) do
      sign_in user
    end

    feature "shows incidents log" do
      scenario "shows only resolved incidents" do
        visit "/incidents"
        expect(page).to have_no_content("First incident")
        expect(page).to have_content("Custom title")
        expect(page).to have_content("Second incident")
      end
    end

    feature "show an incident" do
      scenario "shows only public information when resolved" do
        visit incident_path(incident3)
        expect(page).to have_content(incident3.public_summary)
        expect(page).to have_no_content(incident3.private_description)
        expect(page).to have_no_content(incident3.private_wrc_decision)
      end
    end
  end

  context "when signed out" do
    feature "shows incidents log" do
      scenario "shows only resolved incidents" do
        visit "/incidents"
        expect(page).to have_no_content("First incident")
        expect(page).to have_content("Custom title")
        expect(page).to have_content("Second incident")
      end
    end

    feature "show an incident" do
      scenario "shows only public information when resolved" do
        visit incident_path(incident3)
        expect(page).to have_content(incident3.public_summary)
        expect(page).to have_no_content(incident3.private_description)
        expect(page).to have_no_content(incident3.private_wrc_decision)
      end
    end
  end
end
