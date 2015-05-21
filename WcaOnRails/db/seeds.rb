# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).

case Rails.env
when "production"
  # Do nothing for production
when "development"
  users = (1...10).map do |i|
    DeviseUser.create!(
      name: Faker::Name.name,
      email: Faker::Internet.email,
      password: "wca",
      password_confirmation: "wca",
    )
  end
  100.times do
    sticky = (rand(25) == 0)
    title = Faker::Hacker.say_something_smart
    post = Post.create!(
      sticky: sticky,
      created_at: 2.hours.ago,
      title: title,
      slug: title.parameterize,
      author: users.sample,
      body: Faker::Lorem.paragraph,
    )
  end

  deviseUser = DeviseUser.create!(email: "wca@worldcubeassociation.org",
                                 password: "wca",
                                 password_confirmation: "wca",
                                 admin: true)
  deviseUser.confirm!

  deviseUser = DeviseUser.create!(email: "results_team_1@worldcubeassociation.org",
                                 password: "wca",
                                 password_confirmation: "wca",
                                 results_team: true)
  deviseUser.confirm!

  deviseUser = DeviseUser.create!(email: "results_team_2@worldcubeassociation.org",
                                 password: "wca",
                                 password_confirmation: "wca",
                                 results_team: true)
  deviseUser.confirm!

  OauthApplication.create!(name: "test app",
                          uid: "9ad911ea379bd6f49c4f923644dbea3f44aeab5625a25f468210026a862b0c3d",
                          secret: "3b787d2f6c9e51d1f8c4f758e569517b37d281978812ffea304b965c9bd59720",
                          redirect_uri: "urn:ietf:wg:oauth:2.0:oob")
end
