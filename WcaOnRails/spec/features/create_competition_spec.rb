# frozen_string_literal: true
require "rails_helper"

RSpec.feature "Create competition", js: true do
  let(:delegate) { FactoryGirl.create(:delegate) }
  let(:cloned_delegate) { FactoryGirl.create(:delegate) }
  let(:competition_to_clone) { FactoryGirl.create :competition, cityName: 'Melbourne', delegates: [cloned_delegate], showAtAll: true }

  before :each do
    sign_in delegate
  end

  it 'can create competition' do
    visit "/competitions/new"

    fill_in "Name", with: "New Comp 2015"

    click_button "Create Competition"

    expect(Competition.all.length).to eq 1
    new_competition = Competition.find("NewComp2015")
    expect(new_competition.name).to eq "New Comp 2015"
    expect(new_competition.delegates).to eq [delegate]
  end

  it 'can clone competition' do
    visit clone_competition_path(competition_to_clone)

    fill_in "Name", with: "New Comp 2015"

    expect(page).to have_button('Create Competition')
    click_button "Create Competition"

    expect(Competition.all.length).to eq 2
    new_competition = Competition.find("NewComp2015")
    expect(new_competition.name).to eq "New Comp 2015"
    expect(new_competition.delegates).to eq [delegate, cloned_delegate]
    expect(new_competition.venue).to eq competition_to_clone.venue
    expect(new_competition.showAtAll).to eq false
    expect(new_competition.isConfirmed).to eq false
    expect(new_competition.cityName).to eq 'Melbourne'
  end
end
