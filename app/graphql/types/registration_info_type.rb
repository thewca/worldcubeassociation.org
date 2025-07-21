# frozen_string_literal: true

module Types
  class RegistrationInfoType < Types::BaseObject
    field :open_time, String, null: false
    field :close_time, String, null: false
    field :base_entry_fee, Integer, null: false, method: :base_entry_fee_lowest_denomination
    field :currency_code, String, null: false
    field :on_the_spot_registration, Boolean, null: false
    field :use_wca_registration, Boolean, null: false

    def open_time
      object.registration_open&.iso8601
    end

    def close_time
      object.registration_close&.iso8601
    end
  end
end
