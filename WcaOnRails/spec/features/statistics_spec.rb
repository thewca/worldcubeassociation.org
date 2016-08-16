require 'rails_helper'

describe "statistics" do
  # smoke test for the page,
  # testing all statistics through the web browser is kinda expensive

  def take_part_in_competitions(person, count)
    count.times do |i|
      FactoryGirl.create(:result, personId: person.id, personName: person.name, competitionId: "foo#{i}")
    end
  end

  describe "most competitions of a person" do
    before do
      @persons = [ FactoryGirl.create(:person, name: "Peter"),
                   FactoryGirl.create(:person, name: "Bob"),
                   FactoryGirl.create(:person, name: "Sarah")
                 ]

      take_part_in_competitions(@persons[0], 2)
      take_part_in_competitions(@persons[1], 0)
      take_part_in_competitions(@persons[2], 4)

      visit statistics_path
    end

    it "lists the people" do
      within "#most_competitions" do
        expect(page).to have_content "Peter"
        expect(page).to_not have_content "Bob"
        expect(page).to have_content "Sarah"
        within "tr", text: "Peter" do
          expect(page).to have_content "2"
        end
        within "tr", text: "Sarah" do
          expect(page).to have_content "4"
        end
      end
    end
  end
end
