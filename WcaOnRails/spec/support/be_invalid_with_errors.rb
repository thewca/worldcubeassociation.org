# frozen_string_literal: true

RSpec::Matchers.define :be_invalid_with_errors do |errors|
  match do |ar_object|
    !ar_object.valid? && errors.all? { |k, v| ar_object.errors[k] == v }
  end

  failure_message do |ar_object|
    if ar_object.valid?
      "expected that #{ar_object} would be invalid"
    else
      "expected to find the following errors: #{errors}, instead found #{ar_object.errors.messages}"
    end
  end
end
