def self.random_user
  {
    name: Faker::Name.name,
    email: Faker::Internet.email,
    password: "wca",
    password_confirmation: "wca",
  }
end

# Create board members
8.times do
  User.create!(random_user.merge({
    delegate_status: "board_member",
    region: Faker::Address.country,
  })).confirm!
end

# Create senior delegates and their subordinate delegates
5.times do
  senior_delegate = User.create!(random_user.merge({
    delegate_status: "senior_delegate",
    region: Faker::Address.country,
  }))
  senior_delegate.confirm!
  rand(10).times do
    delegate = User.create!(random_user.merge({
      delegate_status: [ "delegate", "candidate_delegate" ].sample,
      senior_delegate: senior_delegate,
      region: Faker::Address.country,
    }))
    delegate.confirm!
  end
end

# Create some delegates without a senior delegate
5.times do
  delegate = User.create!(random_user.merge({
    delegate_status: [ "delegate", "candidate_delegate" ].sample,
    senior_delegate: nil,
    region: Faker::Address.country,
  }))
  delegate.confirm!
end

# Create members and leaders for every WCA team
UsersController.WCA_TEAMS.each do |team|
  leader_team = :"#{team}_leader"
  leader = User.create!(random_user.merge(
    team => true,
    leader_team => true,
    name: team.to_s,
  ))
  leader.confirm!
  # The team name isn't a valid email, but it's so much easier to type.
  leader.update_column(:email, team.to_s)

  3.times do
    user = User.create!(random_user.merge(team => true))
    user.confirm!
  end
end
