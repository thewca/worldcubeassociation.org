# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DocumentsHelper do
  before do
    keys = [
      "documents/motions/01.2025.1 - Spirit.pdf",
      "documents/motions/10.2021.3 - Disciplinary Committee.pdf",
      "documents/motions/10.2025.3 - Integrity Committee.pdf",
      "documents/motions/10.2024.11 - Software Team.pdf",
      "documents/minutes/2018-01-16 WCA Board Meeting.pdf",
    ]
    metadata = keys.map { |key| { name: File.basename(key, ".pdf"), key: key } }
    allow(helper).to receive(:archive_metadata).and_return(metadata)
  end

  describe "#latest_motion_url" do
    it "resolves to the most recent year, even when the title changed" do
      expect(helper.latest_motion_url("10", "3"))
        .to eq "https://documents.worldcubeassociation.org/documents/motions/10.2025.3%20-%20Integrity%20Committee.pdf"
    end

    it "resolves a motion whose most recent version is not from the latest year" do
      expect(helper.latest_motion_url("10", "11"))
        .to eq "https://documents.worldcubeassociation.org/documents/motions/10.2024.11%20-%20Software%20Team.pdf"
    end

    it "ignores zero padding on the section" do
      expect(helper.latest_motion_url("1", "1")).to eq helper.latest_motion_url("01", "1")
    end

    it "returns nil for a motion that no longer exists" do
      expect(helper.latest_motion_url("20", "0")).to be_nil
    end

    it "does not match documents outside the motions directory" do
      expect(helper.latest_motion_url("2018", "16")).to be_nil
    end
  end
end
