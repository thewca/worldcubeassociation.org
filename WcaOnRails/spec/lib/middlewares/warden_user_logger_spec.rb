require 'middlewares/warden_user_logger'
require 'ostruct'

describe Middlewares::WardenUserLogger do
  describe "call" do
    let(:app) { double(:app) }
    let(:logger) { -> (s) { log_statements << s } }
    let(:log_statements) { [] }
    subject { described_class.new(app, logger: logger) }

    before :each do
      # Make sure we pass the env hash unmodified to the next
      # middleware in the chain.
      expect(app).to receive(:call).with(env)
    end

    context "env filled with warden session information" do
      let(:env) { {'warden' => OpenStruct.new(user: OpenStruct.new(id: 42)) } }

      it "logs the correct user id" do
        subject.call(env)
        expect(log_statements).to eq ["[User Id] Request was made by user id: 42"]
      end
    end

    context "env not filled with warden session information" do
      let(:env) { {'warden' => OpenStruct.new } }

      it "logs the absence of a logged in user" do
        subject.call(env)
        expect(log_statements).to eq ["[User Id] Request was made by user id: <not logged in>"]
      end
    end
  end
end
