# frozen_string_literal: true

module Types
  class RegistrationType < Types::BaseObject
    field :wcaRegistrationId, Integer, null: false
    field :eventIds, [String], null: false
    field :status, String, null: false
    field :guests, Integer, null: false
    field :comments, String, null: false
    field :administrativeNotes, String, null: false
    field :isCompeting, Boolean, null: false
  end
end
