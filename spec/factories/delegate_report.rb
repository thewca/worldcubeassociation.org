# frozen_string_literal: true

FactoryBot.define do
  factory :delegate_report do
    competition { FactoryBot.create(:competition) }

    trait :posted do
      schedule_url { "http://example.com" }
      posted_at { Time.now }
      posted_by_user { FactoryBot.create(:user) }
      upload_files { true }
      discussion_url { "http://example.com" }
    end

    trait :with_images do
      upload_files { true }
    end

    transient do
      upload_files { false }
    end

    initialize_with do
      competition.delegate_report
    end

    after(:build, :create) do |dr, evaluator|
      if evaluator.upload_files
        dr.required_setup_images_count.times do |i|
          default_io = Rails.root.join("app/assets/images/og-wca_logo.png").open('rb')

          dr.setup_images.attach(
            io: default_io,
            filename: "venue_setup_#{i}.png",
          )
        end
      end
    end
  end
end
