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

  # Create senior delegates and their subordinate delegates
  5.times do
    senior_delegate = FactoryBot.create(:senior_delegate_role)
    rand(10).times do
      FactoryBot.create([:delegate, :junior_delegate].sample,
                        region_id: senior_delegate.group.id)
    end
  end

  # Create some delegates without a senior delegate
  5.times do
    FactoryBot.create([:delegate, :junior_delegate].sample)
  end

  # Create members and leaders for every WCA team
  UsersController.WCA_TEAMS.each do |team_friendly_id|
    team_id = Team.find_by_friendly_id(team_friendly_id).id

    leader = FactoryBot.create(:user)
    FactoryBot.create(:team_member, user_id: leader.id, team_id: team_id, team_leader: true)
    # The team name isn't a valid email, but it's so much easier to type.
    leader.update_column(:email, "#{team_friendly_id}_team@valid.domain")

    3.times do
      member = FactoryBot.create(:user)
      FactoryBot.create(:team_member, user_id: member.id, team_id: team_id)
    end
  end
end

# Create a bunch of people with WCA IDs so we can seed large competitions.
100.times do
  FactoryBot.create :user, :wca_id
end
