after "development:users" do
  results_team_users = Team.find_by_friendly_id('software').team_members.map(&:user)
  100.times do
    sticky = (rand(25) == 0)
    title = Faker::Hacker.say_something_smart
    post = Post.create!(
      sticky: sticky,
      world_readable: true,
      created_at: 2.hours.ago,
      title: title,
      slug: title.parameterize,
      author: results_team_users.sample,
      body: Faker::Lorem.paragraph,
    )
  end
end
