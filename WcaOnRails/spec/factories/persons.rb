FactoryGirl.define do
  factory :person do
    sequence :id do |n|
      "2005FLEI%02i" % n
    end
    name { Faker::Name.name }
  end
end
