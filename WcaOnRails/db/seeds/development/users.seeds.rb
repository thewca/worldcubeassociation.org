# frozen_string_literal: true
after :teams do
  def self.random_user
    {
      name: Faker::Name.name,
      country_iso2: "US",
      gender: "m",
      dob: Date.new(1980, 1, 1),
      email: Faker::Internet.email,
      password: "wca",
      password_confirmation: "wca",
    }
  end

  # Create board members
  board_team = Team.find_by_slug('board-members')
  8.times do
    FactoryGirl.create(:team_member, :board_member, team: board_team)
  end

  # Create senior delegates and their subordinate delegates
  delegates_committee = Committee.find_by_slug(Committee::WCA_DELEGATES_COMMITTEE)
  delegate_team = Team.where("slug = :slug", slug: 'delegate-testing-team').first_or_create(name: 'Delegate Testing Team', description: 'For testing', committee_id: delegates_committee.id)
  5.times do
    FactoryGirl.create(:team_member, :senior_delegate, team: delegate_team)
    rand(10).times do
      FactoryGirl.create(:team_member, [ :delegate, :candidate_delegate ].sample, team: delegate_team)
    end
  end

  # Create a leader and members for the software WCA committee
  software_team = Team.find_by_slug('software-team')
  FactoryGirl.create(:team_member, :software_team_leader)
  3.times do
    FactoryGirl.create(:team_member, team: software_team)
  end

  # Create a leader and members for the results WCA committee
  results_team = Team.find_by_slug('results-team')
  FactoryGirl.create(:team_member, :results_team_leader)
  3.times do
    FactoryGirl.create(:team_member, team: results_team)
  end

  # Create a leader and members for the regulations WCA committee
  regulations_team = Team.find_by_slug('regulations-team')
  FactoryGirl.create(:team_member, :regulations_team_leader)
  3.times do
    FactoryGirl.create(:team_member, team: regulations_team)
  end

  # Create a leader and members for the disciplinary WCA committee
  disciplinary_team = Team.find_by_slug('disciplinary-team')
  FactoryGirl.create(:team_member, :disciplinary_team_leader)
  3.times do
    FactoryGirl.create(:team_member, team: disciplinary_team)
  end
end

# Create a bunch of people with WCA IDs so we can seed large competitions.
100.times do
  FactoryGirl.create :user, :wca_id
end
