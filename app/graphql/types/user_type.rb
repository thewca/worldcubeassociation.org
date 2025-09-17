# frozen_string_literal: true

module Types
  class UserType < Types::BaseObject
    field :registrantId, Integer, null: true
    field :name, String, null: false
    field :wcaUserId, Integer, null: false
    field :wcaId, String, null: true
    field :countryIso2, String, null: false
    field :gender, String, null: false
    field :birthdate, String, null: false, require_authorization: true
    field :email, String, null: false, require_authorization: true
    field :avatar, Types::UserAvatarType, null: true
    field :roles, [String], null: false
    field :registration, Types::RegistrationType, null: true
    field :assignments, [Types::AssignmentType], null: false
    field :personalBests, [Types::PersonalBestType], null: false
    field :extensions, [Types::WcifExtensionType], null: false
  end
end
