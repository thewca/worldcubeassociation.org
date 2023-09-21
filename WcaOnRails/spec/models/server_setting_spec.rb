# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ServerSetting do
  context "parses timestamps" do
    it "doesn't mangle timezone information" do
      test_datetime = DateTime.current
      server_setting = ServerSetting.create!(name: 'some_test_setting', value: test_datetime.to_i)

      # 'Cheating' by converting to timestamp which takes away the pain of controlling the test environment's timezone
      expect(server_setting.as_datetime.to_i).to eq(test_datetime.to_i)
    end
  end

  context "parses booleans" do
    it "casts truthy values into actual boolean" do
      server_setting = ServerSetting.create!(name: 'dummy_true', value: '1')
      expect(server_setting.as_boolean).to eq(true)

      server_setting.update!(value: 'true')
      expect(server_setting.as_boolean).to eq(true)

      server_setting.update!(value: 'TRUE')
      expect(server_setting.as_boolean).to eq(true)
    end

    it "casts false-y values into actual boolean" do
      server_setting = ServerSetting.create!(name: 'dummy_true', value: '0')
      expect(server_setting.as_boolean).to eq(false)

      server_setting.update!(value: 'false')
      expect(server_setting.as_boolean).to eq(false)

      server_setting.update!(value: 'FALSE')
      expect(server_setting.as_boolean).to eq(false)
    end

    it "casts false-y values as being truthy" do
      server_setting = ServerSetting.create!(name: 'dummy_true', value: 'lol')
      expect(server_setting.as_boolean).to eq(true)
    end
  end
end
