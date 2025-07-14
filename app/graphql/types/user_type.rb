# frozen_string_literal: true

module Types
  class UserType < Types::BaseObject
    field :registrant_id, Integer, null: true
    field :name, String, null: false
    field :wca_user_id, Integer, null: false
    field :wca_id, String, null: true
    field :country_iso2, String, null: false
    field :gender, String, null: false
    field :birthdate, String, null: false
    field :email, String, null: false
    field :avatar, Types::UserAvatarType, null: false
    field :roles, [String], null: false
    field :registration, Types::RegistrationType, null: false
    field :assignments, [Types::AssignmentType], null: false
    field :personal_bests, [Types::PersonalBestType], null: false
    field :extensions, [Types::WcifExtensionType], null: false
  end
end
