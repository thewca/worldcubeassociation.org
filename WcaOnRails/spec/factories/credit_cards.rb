# frozen_string_literal: true

FactoryBot.define do
  factory :credit_card, class: Hash do
    number { "4242424242424242" }
    exp_month { 12 }
    exp_year { (Time.now.year + 1) % 100 }
    cvc { "314" }

    trait :sca_card do
      number { "4000002760003184" }
    end

    trait :expired do
      number { "4000000000000069" }
    end

    trait :incorrect_cvc do
      number { "4000000000000127" }
    end

    trait :invalid do
      number { "4000000000000002" }
    end

    initialize_with { attributes }
    skip_create
  end
end
