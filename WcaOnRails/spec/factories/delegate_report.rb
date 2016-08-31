FactoryGirl.define do
  factory :delegate_report do
    competition { FactoryGirl.create :competition }

    trait :posted do
      schedule_url "http://example.com"
      posted_at { Time.now }
      posted_by_user { FactoryGirl.create(:user) }
    end

    initialize_with do
      competition.delegate_report
    end
  end
end
