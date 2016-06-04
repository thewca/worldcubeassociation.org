require "rails_helper"

RSpec.feature "Create Committees", js: true do
  let(:admin) { FactoryGirl.create(:admin) }

  before :each do
    sign_in admin
  end

  it 'can create committee when signed in as admin' do
    visit "/committees/new"

    fill_in "Name", with: "Random Ideas Committee"
    fill_in "Email", with: "random@worldcubeassociation.org"
    fill_in "Duties", with: "Come up with random ideas about cubing."

    click_button "Create a New Committee"

    expect(page).to have_content("Random Ideas Committee")
    expect(page).to have_content("random@worldcubeassociation.org")
  end
end
