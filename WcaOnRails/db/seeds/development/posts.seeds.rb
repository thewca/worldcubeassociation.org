# frozen_string_literal: true
after "development:users" do
  results_team_users = Committee.find_by_slug(Committee::WCA_RESULTS_COMMITTEE).team_members.map(&:user)
  100.times do
    sticky = (rand(25) == 0)
    title = Faker::Hacker.say_something_smart
    Post.create!(
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
