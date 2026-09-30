# frozen_string_literal: true

require 'rails_helper'

RSpec.describe MarkdownImagesController do
  let(:uploader) { create(:user) }
  let(:delegate) { create(:delegate) }
  let(:report) { create(:competition, :with_delegate_report, delegates: [delegate]).delegate_report }

  def upload(visibility)
    MarkdownImage.new(uploaded_by: uploader, visibility: visibility).tap do |markdown_image|
      markdown_image.attach_image(io: File.open('spec/support/logo.png'), filename: 'logo.png', content_type: 'image/png')
      markdown_image.save!
    end
  end

  context "a private image embedded in a delegate report" do
    let!(:markdown_image) do
      upload(:private).tap { report.update!(summary: "![photo](#{it.url})") }
    end

    it "404s for a signed-out visitor" do
      get markdown_image_path(markdown_image)
      expect(response).to have_http_status(:not_found)
    end

    it "404s for a signed-in user who cannot read the report" do
      sign_in create(:user)
      get markdown_image_path(markdown_image)
      expect(response).to have_http_status(:not_found)
    end

    it "redirects a delegate who can read the report to the file" do
      sign_in delegate
      get markdown_image_path(markdown_image)
      expect(response).to have_http_status(:found)
    end

    it "lets the uploader see their own image" do
      sign_in uploader
      get markdown_image_path(markdown_image)
      expect(response).to have_http_status(:found)
    end
  end

  it "serves a public image to anyone" do
    get markdown_image_path(upload(:public))
    expect(response).to have_http_status(:found)
  end
end
