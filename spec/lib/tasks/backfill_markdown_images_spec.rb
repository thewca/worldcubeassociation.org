# frozen_string_literal: true

require 'rails_helper'
require 'rake'

# The guard that keeps delegate report setup images and regional organisation
# files out of MarkdownImage never fires on production data - none of the 13,395
# markdown-referenced blobs is attached to anything - so it is only covered here.
RSpec.describe "markdown_images:backfill", type: :task do
  before(:all) do
    Rake.application.rake_require "tasks/backfill_markdown_images" unless defined?(MarkdownImageBackfill)
    Rake::Task.define_task(:environment)
  end

  def blob_for(filename)
    ActiveStorage::Blob.create_and_upload!(io: File.open('spec/support/logo.png'), filename: filename, content_type: 'image/png')
  end

  it "accepts a blob that nothing has attached" do
    blob, reason = MarkdownImageBackfill.eligible_blob(blob_for('orphan.png').id)

    expect(blob).to be_present
    expect(reason).to be_nil
  end

  it "refuses a blob that is attached to something else" do
    delegate_report = create(:competition, :with_delegate_report).delegate_report
    delegate_report.setup_images.attach(blob_for('setup.png'))

    blob, reason = MarkdownImageBackfill.eligible_blob(delegate_report.setup_images.first.blob_id)

    expect(blob).to be_nil
    expect(reason).to eq :already_attached
  end

  it "reuses the MarkdownImage it already created for a blob" do
    blob = blob_for('shared.png')
    markdown_image = MarkdownImage.new
    markdown_image.image.attach(blob)
    markdown_image.save!

    found, reason = MarkdownImageBackfill.eligible_blob(blob.id)

    expect(reason).to be_nil
    expect(found).to eq blob
  end
end
