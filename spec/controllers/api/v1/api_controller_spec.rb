# frozen_string_literal: true

RSpec.describe Api::V1::ApiController do
  let(:controller_instance) { described_class.new }

  describe '#camelize_keys' do
    it 'camelizes nested hash keys' do
      input = { some_key: { nested_key: 'value' }, array_key: [{ another_key: 'val' }] }
      expected = { 'someKey' => { 'nestedKey' => 'value' }, 'arrayKey' => [{ 'anotherKey' => 'val' }] }

      result = controller_instance.send(:camelize_keys, input)
      expect(result).to eq(expected)
    end

    it 'camelizes nested array keys' do
      input = [{ some_key: { nested_key: 'value' } }, { array_key: [{ another_key: 'val' }] }]
      expected = [{ 'someKey' => { 'nestedKey' => 'value' } }, { 'arrayKey' => [{ 'anotherKey' => 'val' }] }]

      result = controller_instance.send(:camelize_keys, input)
      expect(result).to eq(expected)
    end
  end
end
