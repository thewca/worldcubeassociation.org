# frozen_string_literal: true

after "development:users" do
  wct_users = UserGroup.teams_committees_group_wct.active_users
  100.times do
    sticky = (rand(25) == 0)
    title = Faker::Hacker.say_something_smart
    Post.create!(
      sticky: sticky,
      created_at: 2.hours.ago,
      title: title,
      slug: title.parameterize,
      author: wct_users.sample,
      body: Faker::Lorem.paragraph,
    )
  end
end
