# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SanityCheck do
  context "SQL Files" do
    it "Can read all files" do
      SanityCheck.find_each do |sanity_check|
        expect { sanity_check.query }.not_to raise_error
        expect(sanity_check.query.presence).not_to be_nil
      end
    end
  end
end
