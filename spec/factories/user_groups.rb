# frozen_string_literal: true

FactoryBot.define do
  factory :user_group do
    factory :delegate_probations_user_group do
      name { "Delegate Probation" }
      group_type { :delegate_probation }
      is_active { true }
      is_hidden { true }
    end

    factory :translators_user_group do
      name { "Translators" }
      group_type { :translators }
      is_active { true }
      is_hidden { true }
    end

    factory :officers_user_group do
      name { "WCA Officers" }
      group_type { :officers }
      is_active { true }
      is_hidden { false }
    end
  end
end
