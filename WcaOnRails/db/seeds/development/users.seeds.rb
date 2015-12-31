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
8.times do
  FactoryGirl.create(:board_member)
end

# Create senior delegates and their subordinate delegates
5.times do
  senior_delegate = FactoryGirl.create(:senior_delegate)
  rand(10).times do
    delegate = FactoryGirl.create([ :delegate, :candidate_delegate ].sample,
                                  senior_delegate: senior_delegate)
  end
end

# Create some delegates without a senior delegate
5.times do
  FactoryGirl.create([ :delegate, :candidate_delegate ].sample)
end

# Create members and leaders for every WCA team
UsersController.WCA_TEAMS.each do |team|
  leader_team = :"#{team}_leader"
  leader = User.new(random_user.merge(
    team => true,
    leader_team => true,
    name: team.to_s,
  ))
  leader.skip_confirmation!
  leader.save!
  # The team name isn't a valid email, but it's so much easier to type.
  leader.update_column(:email, team.to_s)

  3.times do
    user = User.new(random_user.merge(team => true))
    user.skip_confirmation!
    user.save!
  end
end
