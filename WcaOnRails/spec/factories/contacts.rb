# frozen_string_literal: true
FactoryGirl.define do
  factory :contact do |f|
    f.name "Jeremy"
    f.message "Hi"
    f.your_email "jeremy@example.com"
    f.to_email "to@example.com"
    f.subject "Subject"
  end
end
