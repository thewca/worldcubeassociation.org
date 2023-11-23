# frozen_string_literal: true

FactoryBot.define do
  factory :role do
    factory :probation_role do
      user_id { FactoryBot.create(:delegate).id }
      group_id { FactoryBot.create(:delegate_probations_user_group).id }
      start_date { Date.today }
      end_date { Date.today + 1.year }
    end
  end
end
