# frozen_string_literal: true

FactoryBot.define do
  factory :groups_metadata_translators do
    factory :translator_ca_role_metadata do
      locale { 'ca' }
    end
  end
end
