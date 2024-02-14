# frozen_string_literal: true

FactoryBot.define do
  factory :user_avatar do
    filename { 'logo.jpg' }
    status { 'approved' }
    thumbnail_crop_x { 0 }
    thumbnail_crop_y { 0 }
    thumbnail_crop_w { 100 }
    thumbnail_crop_h { 100 }
    backend { 'local' }

    user { FactoryBot.create(:user) }

    trait :pending do
      status { 'pending' }
    end
  end
end
