# frozen_string_literal: true

after :user_groups do
  UserRole.create!(
    user: FactoryBot.create(:user_with_wca_id),
    group: UserGroup.find_by!(group_type: :board),
    start_date: Faker::Date.between(from: 10.years.ago, to: 5.years.ago),
  )
end
