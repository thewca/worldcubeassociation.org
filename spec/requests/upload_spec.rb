# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ResultsSubmissionController do
  let(:image) { Rack::Test::UploadedFile.new('spec/support/logo.png', 'image/png') }
  let(:pdf) { Rack::Test::UploadedFile.new('spec/support/bylaws.pdf', 'application/pdf') }

  context "not signed in" do
    sign_out

    it "redirects when attempting to upload an image" do
      post upload_image_path, params: { image: image }
      expect(response).to redirect_to new_user_session_path
    end
  end

  context "signed in as delegate" do
    before { sign_in create :delegate }

    it "can upload an image" do
      expect { post upload_image_path, params: { image: image } }.to change(MarkdownImage, :count).by(1)

      expect(response.parsed_body['filePath']).not_to be_nil
    end

    it "rejects a file that is not a web image" do
      expect { post upload_image_path, params: { image: pdf } }.not_to change(MarkdownImage, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['error']).to be_present
    end
  end
end
