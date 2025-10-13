# frozen_string_literal: true

REGISTRATION_TRANSITIONS = Registrations::Helper::REGISTRATION_STATES.flat_map do |initial_status|
  Registrations::Helper::REGISTRATION_STATES.map do |new_status|
    { initial_status: initial_status, input_status: new_status }
  end
end
