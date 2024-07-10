# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'The ruby version used' do
  it 'matches the one in the .ruby-version file' do
    project_ruby_version = File.read(Rails.root.join('./.ruby-version')).chomp
    expect(RUBY_VERSION).to eq(project_ruby_version)
  end
end
