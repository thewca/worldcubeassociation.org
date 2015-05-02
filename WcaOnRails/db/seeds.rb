# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).

users = (1...10).map { |i| User.create(name: Faker::Name.name) }
100.times do
  sticky = (rand(25) == 0)
  node = Node.create(sticky: sticky,
                     created: 2.hours.ago.to_i,
                     promote: true,
                     title: Faker::Hacker.say_something_smart,
                     author: users.sample)
  FieldDataBody.create(body_value: Faker::Lorem.paragraph,
                       entity_id: node.nid,
                       delta: 1,
                       entity_type: "node")
  UrlAlias.create(alias: "posts/#{node.title.parameterize}",
                  source: "node/#{node.nid}")
end
