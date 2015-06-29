User.create!(
  email: "results_team_1@worldcubeassociation.org",
  name: "Mr. Croup",
  password: "wca",
  password_confirmation: "wca",
  results_team: true,
).confirm!

User.create!(
  email: "results_team_2@worldcubeassociation.org",
  name: "Mr. Vandemar",
  password: "wca",
  password_confirmation: "wca",
  results_team: true,
).confirm!

# Create board members
8.times do
  User.create!(
    name: Faker::Name.name,
    email: Faker::Internet.email,
    password: "wca",
    password_confirmation: "wca",
    delegate_status: "board_member",
    region: Faker::Address.country,
  ).confirm!
end

# Create senior delegates and their subordinate delegates
5.times do
  senior_delegate = User.create!(
    name: Faker::Name.name,
    email: Faker::Internet.email,
    password: "wca",
    password_confirmation: "wca",
    delegate_status: "senior_delegate",
    region: Faker::Address.country,
  )
  senior_delegate.confirm!
  rand(10).times do
    delegate = User.create!(
      name: Faker::Name.name,
      email: Faker::Internet.email,
      password: "wca",
      password_confirmation: "wca",
      delegate_status: [ "delegate", "candidate_delegate" ].sample,
      senior_delegate: senior_delegate,
      region: Faker::Address.country,
    )
    delegate.confirm!
  end
end

# Create some delegates without a senior delegate
5.times do
  delegate = User.create!(
    name: Faker::Name.name,
    email: Faker::Internet.email,
    password: "wca",
    password_confirmation: "wca",
    delegate_status: [ "delegate", "candidate_delegate" ].sample,
    senior_delegate: nil,
    region: Faker::Address.country,
  )
  delegate.confirm!
end

# Create administrator
admin = User.create!(
  email: "wca@worldcubeassociation.org",
  name: "Mr. Wca",
  password: "wca",
  password_confirmation: "wca",
  admin: true,
)
admin.confirm!
