# frozen_string_literal: true

require 'middlewares/warden_user_logger'
require 'ostruct'

RSpec.describe Middlewares::WardenUserLogger do
  describe 'call' do
    let(:app) { double(:app) }
    let(:logger) { ->(s) { log_statements << s } }
    let(:log_statements) { [] }
    subject { described_class.new(app, logger: logger) }

    context 'underlying middleware raises exception' do
      let(:dummy_exception) { Class.new(StandardError).new }

      before :each do
        expect(app).to receive(:call).and_raise(dummy_exception)
        expect { subject.call(env) }.to raise_exception(dummy_exception)
      end

      context 'env filled with warden session information' do
        let(:env) { { 'warden' => OpenStruct.new(user: OpenStruct.new(id: 42)) } }

        it 'logs the correct user id' do
          expect(log_statements).to eq ['[User Id] Request was made by user id: 42']
        end
      end

      context 'env not filled with warden session information' do
        let(:env) { { 'warden' => OpenStruct.new } }

        it 'logs the absence of a logged in user' do
          expect(log_statements).to eq ['[User Id] Request was made by user id: <not logged in>']
        end
      end
    end

    context "underlying middleware doesn't raise exception" do
      before :each do
        # Make sure we pass the env hash unmodified to the next
        # middleware in the chain.
        expect(app).to receive(:call).with(env)

        subject.call(env)
      end

      context 'env filled with warden session information' do
        let(:env) { { 'warden' => OpenStruct.new(user: OpenStruct.new(id: 42)) } }

        it 'logs the correct user id' do
          expect(log_statements).to eq ['[User Id] Request was made by user id: 42']
        end
      end

      context 'env not filled with warden session information' do
        let(:env) { { 'warden' => OpenStruct.new } }

        it 'logs the absence of a logged in user' do
          expect(log_statements).to eq ['[User Id] Request was made by user id: <not logged in>']
        end
      end
    end
  end
end
