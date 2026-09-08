# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "motion permalinks" do
  before do
    keys = [
      "documents/motions/01.2025.1 - Spirit.pdf",
      "documents/motions/10.2021.3 - Disciplinary Committee.pdf",
      "documents/motions/10.2025.3 - Integrity Committee.pdf",
    ]
    metadata = keys.map { |key| { name: File.basename(key, ".pdf"), key: key } }
    allow_any_instance_of(StaticPagesController).to receive(:archive_metadata).and_return(metadata)
  end

  it "redirects to the current version of the motion" do
    get "/documents/motions/10.3"

    expect(response).to redirect_to "https://documents.worldcubeassociation.org/documents/motions/10.2025.3%20-%20Integrity%20Committee.pdf"
  end

  it "keeps the section and subsection out of the format" do
    get "/documents/motions/01.1"

    expect(response).to redirect_to "https://documents.worldcubeassociation.org/documents/motions/01.2025.1%20-%20Spirit.pdf"
  end

  it "renders a not found page for a repealed motion" do
    get "/documents/motions/20.0"

    expect(response).to have_http_status :not_found
    expect(response.body).to include "Motion Not Found"
    expect(response.body).to include '<a href="/documents">Documents</a>'
  end
end
