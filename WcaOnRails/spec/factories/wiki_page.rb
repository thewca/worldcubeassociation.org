# frozen_string_literal: true
FactoryGirl.define do
  factory :wiki_page do
    author
    title "Awesome wiki page"
    content "This is example wiki page content"
  end
end
