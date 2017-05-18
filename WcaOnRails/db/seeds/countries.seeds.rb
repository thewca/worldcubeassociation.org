# frozen_string_literal: true

Country::ALL_STATES.each do |state|
  Country.create!(state)
end
