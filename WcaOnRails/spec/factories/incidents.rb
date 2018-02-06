# frozen_string_literal: true

FactoryBot.define do
  factory :incident do
    name "MyString"
    private_description "MyText"
    private_wrc_decision "MyText"
    public_summary "MyText"
  end
end
