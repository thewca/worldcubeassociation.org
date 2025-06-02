# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'v1_api_controller' do
  describe '#snake_case_params!' do
    it 'sets camelCase keys only to snake_case' do
      test_payload = {
        firstExample: "firstExample",
        secondExample: "secondExample",
      }

      post api_v1_test_action_path, params: test_payload, as: :json
      expect(response.parsed_body).to eq({
        first_example: "firstExample",
        second_example: "secondExample",
      }.stringify_keys)
    end

    it 'snake_case params are unchanged' do
      test_payload = {
        first_example: "firstExample",
        second_example: "secondExample",
      }

      post api_v1_test_action_path, params: test_payload, as: :json
      expect(response.parsed_body).to eq({
        first_example: "firstExample",
        second_example: "secondExample",
      }.stringify_keys)
    end

    it 'mix of snake_case and camelCase gets converted to all snake_case' do
      test_payload = {
        firstExample: "firstExample",
        second_example: "secondExample",
      }

      post api_v1_test_action_path, params: test_payload, as: :json
      expect(response.parsed_body).to eq({
        first_example: "firstExample",
        second_example: "secondExample",
      }.stringify_keys)
    end

    it 'keys in an array of hashes get converted' do
      test_payload = [
        { firstExample: "firstExample" },
        { secondExample: "secondExample" },
      ]

      post api_v1_test_action_path, params: test_payload, as: :json
      expect(response.parsed_body).to eq({_json: [
        { first_example: "firstExample" },
        { second_example: "secondExample" },
      ]}.deep_stringify_keys)
    end

    it 'keys in a nested hash get converted' do
      test_payload = {
        firstExample: { firstNest: { secondNest: 'value1' } },
        secondExample: { thirdNest: { fourthNest: 'value2' } },
      }

      post api_v1_test_action_path, params: test_payload, as: :json
      expect(response.parsed_body).to eq({
        first_example: { first_nest: { second_nest: 'value1' } },
        second_example: { third_nest: { fourth_nest: 'value2' } },
      }.deep_stringify_keys)
    end

    it 'deeply nested array of hashes/arrays keys all get converted' do
      test_payload = [
        firstExample: [ firstNest: { secondNest: 'value1' }, anotherNest: { anotherNestKey: 'another nest val' } ],
        secondExample: [ thirdNest: { fourthNest: 'value2' }, fifthNest: { fifthNestKey: 'fifth nest val' } ],
      ]

      post api_v1_test_action_path, params: test_payload, as: :json
      expect(response.parsed_body).to eq({_json: [
        first_example: [ first_nest: { second_nest: 'value1' }, another_nest: { another_nest_key: 'another nest val' } ],
        second_example: [ third_nest: { fourth_nest: 'value2' }, fifth_nest: { fifth_nest_key: 'fifth nest val' } ],
      ]}.deep_stringify_keys)
    end

    it 'deeply nested hash of hashes/arrays keys all get converted' do
      test_payload = {
        firstExample: [ firstNest: { secondNest: 'value1' }, anotherNest: { anotherNestKey: 'another nest val' } ],
        secondExample: [ thirdNest: { fourthNest: 'value2' }, fifthNest: { fifthNestKey: 'fifth nest val' } ],
      }

      post api_v1_test_action_path, params: test_payload, as: :json
      expect(response.parsed_body).to eq({
        first_example: [ first_nest: { second_nest: 'value1' }, another_nest: { another_nest_key: 'another nest val' } ],
        second_example: [ third_nest: { fourth_nest: 'value2' }, fifth_nest: { fifth_nest_key: 'fifth nest val' } ],
      }.deep_stringify_keys)
    end
  end
end
