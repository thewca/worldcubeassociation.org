# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).

case Rails.env
when "production"
  # Do nothing for production
when "development"
  results_team_users = []
  results_team_users << User.create!(
    email: "results_team_1@worldcubeassociation.org",
    name: "Mr. Croup",
    password: "wca",
    password_confirmation: "wca",
    results_team: true,
  )
  results_team_users.last.confirm!

  results_team_users << User.create!(
    email: "results_team_2@worldcubeassociation.org",
    name: "Mr. Vandemar",
    password: "wca",
    password_confirmation: "wca",
    results_team: true,
  )
  results_team_users.last.confirm!

  100.times do
    sticky = (rand(25) == 0)
    title = Faker::Hacker.say_something_smart
    post = Post.create!(
      sticky: sticky,
      created_at: 2.hours.ago,
      title: title,
      slug: title.parameterize,
      author: results_team_users.sample,
      body: Faker::Lorem.paragraph,
    )
  end

  # Create board members
  8.times do
    board_member = User.create!(
      name: Faker::Name.name,
      email: Faker::Internet.email,
      password: "wca",
      password_confirmation: "wca",
      delegate_status: "board_member",
      region: Faker::Address.country,
    )
    board_member.confirm!
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

  OauthApplication.create!(name: "test app",
                           uid: "9ad911ea379bd6f49c4f923644dbea3f44aeab5625a25f468210026a862b0c3d",
                           secret: "3b787d2f6c9e51d1f8c4f758e569517b37d281978812ffea304b965c9bd59720",
                           redirect_uri: "urn:ietf:wg:oauth:2.0:oob")
end
