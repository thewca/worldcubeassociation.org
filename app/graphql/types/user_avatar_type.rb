# frozen_string_literal: true

module Types
  class UserAvatarType < Types::BaseObject
    field :url, String, null: false
    field :thumb_url, String, null: false
  end
end
