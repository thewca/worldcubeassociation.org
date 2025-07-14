# frozen_string_literal: true

module Types
  class RegistrationType < Types::BaseObject
    field :wca_registration_id, Integer, null: false
    field :event_ids, [String], null: false
    field :status, String, null: false
    field :guests, Integer, null: false
    field :comments, String, null: false
    field :administrative_notes, String, null: false
    field :is_competing, Boolean, null: false
  end
end
