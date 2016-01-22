require "rails_helper"

RSpec.feature "Create competition", js: true do
  let(:delegate) { FactoryGirl.create(:delegate) }
  let(:competition_to_clone) { FactoryGirl.create :competition }

  before :each do
    sign_in delegate
  end

  it 'can create competition' do
    visit "/competitions/new"

    fill_in "Name", with: "New Comp 2015"

    click_button "Create competition"

    expect(Competition.all.length).to eq 1
    new_competition = Competition.find("NewComp2015")
    expect(new_competition.name).to eq "New Comp 2015"
    expect(new_competition.delegates).to eq [delegate]
    expect(new_competition.venue).to eq ""
  end

  it 'can clone competition' do
    visit "/competitions/new"

    fill_in "Name", with: "New Comp 2015"

    expect(page).to have_button('Create competition')

    # Fill in competition to clone field, but don't select an actual competition.
    # This should change the submit button to "Clone competition", but it should
    # be disabled.
    selectize_input = page.find("div.competition_competition_id_to_clone .selectize-control input")
    selectize_input.native.send_key(competition_to_clone.id)
    expect(page).to have_button('Clone competition', disabled: true)

    # Now actually select something, and verify that the "Clone competition" button
    # is enabled.
    #  Wait for selectize popup to appear.
    expect(page).to have_selector("div.selectize-dropdown", visible: true)
    #  Select item with selectize.
    page.find("div.competition_competition_id_to_clone input").native.send_key(:return)
    #  Verify clone competition button is enabled.
    expect(page).to have_button('Clone competition', disabled: false)
    click_button "Clone competition"

    expect(Competition.all.length).to eq 2
    new_competition = Competition.find("NewComp2015")
    expect(new_competition.name).to eq "New Comp 2015"
    expect(new_competition.delegates).to eq [delegate]
    expect(new_competition.venue).to eq competition_to_clone.venue
  end
end
