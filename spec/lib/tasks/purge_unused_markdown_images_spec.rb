# frozen_string_literal: true

require 'rails_helper'
require 'rake'

RSpec.describe "markdown_images:purge_unused", type: :task do
  before(:all) do
    Rake.application.rake_require "tasks/purge_unused_markdown_images"
    Rake::Task.define_task(:environment)
  end

  around do |example|
    ENV['DRY_RUN'] = 'false'
    example.run
    ENV.delete('DRY_RUN')
    Rake::Task['markdown_images:purge_unused'].reenable
  end

  def blob(created_at: 1.year.ago)
    ActiveStorage::Blob.create_and_upload!(io: File.open('spec/support/logo.png'), filename: 'logo.png', content_type: 'image/png')
                       .tap { it.update_column(:created_at, created_at) }
  end

  def purge = Rake::Task['markdown_images:purge_unused'].invoke

  it "deletes an orphan blob that nothing references" do
    orphan = blob

    expect { purge }.to change(ActiveStorage::Blob, :count).by(-1)
    expect(ActiveStorage::Blob.exists?(orphan.id)).to be false
  end

  it "keeps a blob embedded in markdown" do
    used = blob
    create(:post, body: "![logo](#{Rails.application.routes.url_helpers.rails_blob_url(used)})")

    purge

    expect(ActiveStorage::Blob.exists?(used.id)).to be true
  end

  # The guard that matters most: delegate report setup images live in the same
  # bucket and must never be treated as unused markdown.
  it "keeps a blob attached to something that is not a MarkdownImage" do
    delegate_report = create(:competition, :with_delegate_report).delegate_report
    delegate_report.setup_images.attach(blob)

    purge

    expect(delegate_report.reload.setup_images).to be_attached
  end

  it "keeps a recent orphan, because its draft may not be saved yet" do
    recent = blob(created_at: 2.days.ago)

    expect { purge }.not_to change(ActiveStorage::Blob, :count)
    expect(ActiveStorage::Blob.exists?(recent.id)).to be true
  end

  it "deletes a MarkdownImage once nothing uses it any more" do
    markdown_image = MarkdownImage.new
    markdown_image.image.attach(blob)
    markdown_image.save!
    markdown_image.update_column(:created_at, 1.year.ago)

    expect { purge }.to change(MarkdownImage, :count).by(-1)
  end
end
