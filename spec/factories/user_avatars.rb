# frozen_string_literal: true

FactoryBot.define do
  factory :user_avatar do
    filename { 'logo.jpg' }
    status { UserAvatar.statuses[:approved] }
    thumbnail_crop_x { 0 }
    thumbnail_crop_y { 0 }
    thumbnail_crop_w { 100 }
    thumbnail_crop_h { 100 }
    backend { UserAvatar.backends[:local] }

    user { FactoryBot.create(:user) }

    trait :pending do
      status { 'pending' }
    end

    transient do
      upload_file { false }
    end

    after(:create) do |avatar, evaluator|
      if evaluator.upload_file
        default_io = File.open(Rails.root.join('app', 'assets', 'images', UserAvatar::DEFAULT_AVATAR_FILE), 'rb')

        avatar.attach_image(
          io: default_io,
          filename: UserAvatar::DEFAULT_AVATAR_FILE,
        )
      end
    end
  end
end
