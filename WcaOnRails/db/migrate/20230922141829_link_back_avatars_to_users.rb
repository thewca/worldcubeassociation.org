# frozen_string_literal: true

class LinkBackAvatarsToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :current_avatar_id, :bigint, after: :legacy_avatar
    add_column :users, :pending_avatar_id, :bigint, after: :current_avatar_id

    UserAvatar.approved.find_each do |avatar|
      avatar.user.update_attribute :current_avatar, avatar
    end

    UserAvatar.pending.find_each do |avatar|
      avatar.user.update_attribute :pending_avatar, avatar
    end
  end
end
