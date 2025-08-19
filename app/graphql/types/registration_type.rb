# frozen_string_literal: true

module Types
  class RegistrationType < Types::BaseObject
    field :wcaRegistrationId, Integer, null: false
    field :eventIds, [String], null: false
    field :status, String, null: false
    field :guests, Integer, null: false, require_authorization: true
    field :comments, String, null: false, require_authorization: true
    field :administrativeNotes, String, null: false, require_authorization: true
    field :isCompeting, Boolean, null: false
  end
end
