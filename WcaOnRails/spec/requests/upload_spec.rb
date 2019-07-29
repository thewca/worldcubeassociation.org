# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ResultsSubmissionController, type: :request do
  let(:image) { Rack::Test::UploadedFile.new('spec/support/logo.png', 'image/png') }

  context "not signed in" do
    sign_out

    it "redirects when attempting to upload an image" do
      post upload_image_path, params: { image: image }
      expect(response).to redirect_to new_user_session_path
    end
  end

  context "signed in as delegate" do
    sign_in { FactoryBot.create :delegate }

    it "can upload an image" do
      post upload_image_path, params: { image: image }
      json = JSON.parse(response.body)
      expect(json['filePath']).not_to be_nil
    end
  end
end
