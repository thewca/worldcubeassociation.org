# frozen_string_literal: true

require "rails_helper"

RSpec.describe AddRegistrationJob do
  it "does not evaluate the lane name as code" do
    expect do
      described_class.perform_now("competing; raise 'evaluated'", "NoSuchComp2026", 0, {})
    end.to raise_error(NameError, /wrong constant name/)
  end

  it "does not resolve lanes outside Registrations::Lanes" do
    expect do
      described_class.perform_now("::Kernel", "NoSuchComp2026", 0, {})
    end.to raise_error(NameError, /wrong constant name/)
  end
end
