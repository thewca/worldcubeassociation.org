# frozen_string_literal: true

FactoryBot.define do
  factory :contact_form do |f|
    f.name { "Jeremy" }
    f.your_email { "jeremy@example.com" }
    f.to_email { "to@example.com" }
    f.subject { "Subject" }
  end
end
