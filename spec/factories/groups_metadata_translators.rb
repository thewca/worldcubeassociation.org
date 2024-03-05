# frozen_string_literal: true

FactoryBot.define do
  factory :groups_metadata_translators do
    factory :translator_en_role_metadata do
      locale { "en" }
    end
  end
end
