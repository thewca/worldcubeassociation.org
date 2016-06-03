FactoryGirl.define do
  factory :delegate_report do
    competition { FactoryGirl.create :competition }
  end
end
