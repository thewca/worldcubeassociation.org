# frozen_string_literal: true

module Types
  class RegistrationInfoType < Types::BaseObject
    field :open_time, String, null: false
    field :close_time, String, null: false
    field :base_entry_fee, Integer, null: false
    field :currency_code, String, null: false
    field :on_the_spot_registration, Boolean, null: true
    field :use_wca_registration, Boolean, null: false
  end
end
