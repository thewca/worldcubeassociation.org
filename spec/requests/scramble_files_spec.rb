# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Scramble files" do
  describe "DELETE /scramble_files/:id" do
    let(:competition) { create(:competition, :past, :announced) }
    let(:delegate) { competition.delegates.first }
    let!(:scramble_upload) { ScrambleFileUpload.create!(competition: competition, uploaded_by_user: delegate, raw_wcif: {}) }

    it "deletes the upload for a delegate of the competition" do
      sign_in delegate

      delete scramble_file_path(scramble_upload)

      expect(response).to be_successful
      expect(ScrambleFileUpload.exists?(scramble_upload.id)).to be false
    end

    it "does not delete the upload for a regular user" do
      sign_in create(:user)

      delete scramble_file_path(scramble_upload)

      expect(response).to redirect_to root_url
      expect(ScrambleFileUpload.exists?(scramble_upload.id)).to be true
    end

    it "does not delete the upload for a delegate of another competition" do
      sign_in create(:competition, :past, :announced).delegates.first

      delete scramble_file_path(scramble_upload)

      expect(response).to redirect_to root_url
      expect(ScrambleFileUpload.exists?(scramble_upload.id)).to be true
    end
  end
end
