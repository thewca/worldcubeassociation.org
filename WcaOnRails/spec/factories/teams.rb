# frozen_string_literal: true
FactoryGirl.define do
  factory :team do
    friendly_id 'foo'
    name 'Foo Team'
    description "Just a fake team."
  end

end
