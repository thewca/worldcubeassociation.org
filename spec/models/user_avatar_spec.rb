# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UserAvatar do
  describe 'thumbnail crop validation' do
    it 'rejects a zero-sized crop on active_storage avatars' do
      avatar = build(
        :user_avatar,
        backend: UserAvatar.backends[:active_storage],
        thumbnail_crop_w: 0,
        thumbnail_crop_h: 0,
      )

      expect(avatar).not_to be_valid
      expect(avatar.errors).to include(:thumbnail_crop_w, :thumbnail_crop_h)
    end

    it 'does not validate crops on legacy backends' do
      avatar = build(
        :user_avatar,
        backend: UserAvatar.backends[:s3_legacy_cdn],
        thumbnail_crop_w: 0,
        thumbnail_crop_h: 0,
      )

      avatar.valid?
      expect(avatar.errors).not_to include(:thumbnail_crop_w)
    end
  end
end
