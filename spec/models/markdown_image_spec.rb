# frozen_string_literal: true

require 'rails_helper'

RSpec.describe MarkdownImage do
  let(:user) { create(:user) }

  def upload_image(visibility: :public)
    MarkdownImage.new(uploaded_by: user, visibility: visibility).tap do |markdown_image|
      markdown_image.attach_image(io: File.open('spec/support/logo.png'), filename: 'logo.png', content_type: 'image/png')
      markdown_image.save!
    end
  end

  # `ActiveStorage::Blob.find_signed` resolves none of the signed ids embedded in
  # existing markdown - they were signed with keys this app no longer uses. It
  # returned nil for all 617 ids sampled from real competition tabs, which would
  # have made every save drop the usages for the images it still contains.
  describe ".blob_id_from" do
    it "decodes a legacy Marshal-wrapped signed id that find_signed cannot verify" do
      signed_id = "eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBdlVXIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--0000"

      expect(ActiveStorage::Blob.find_signed(signed_id)).to be_nil
      expect(MarkdownImage.blob_id_from(signed_id)).to eq 5877
    end

    it "returns nil for a signed id it cannot make sense of" do
      expect(MarkdownImage.blob_id_from("not-a-signed-id")).to be_nil
    end
  end

  it "finds the image behind a legacy URL in markdown" do
    markdown_image = upload_image
    blob_id = markdown_image.image.blob.id
    legacy_url = "https://www.worldcubeassociation.org/rails/active_storage/blobs/#{markdown_image.image.blob.signed_id}/logo.png"

    expect(MarkdownImage.blob_ids_in(legacy_url)).to include blob_id
  end

  it "rejects a file that is not a web image" do
    markdown_image = MarkdownImage.new(uploaded_by: user, visibility: :public)
    markdown_image.attach_image(io: File.open('spec/support/bylaws.pdf'), filename: 'bylaws.pdf', content_type: 'application/pdf')

    expect(markdown_image).not_to be_valid
  end

  # The content type the client declares is attacker-controlled, so it is not
  # what the validation may go on.
  it "rejects a file that only claims to be a web image" do
    markdown_image = MarkdownImage.new(uploaded_by: user, visibility: :public)
    markdown_image.attach_image(io: File.open('spec/support/bylaws.pdf'), filename: 'bylaws.pdf', content_type: 'image/png')

    expect(markdown_image).not_to be_valid
  end

  it "rejects a record with no file at all" do
    expect(MarkdownImage.new(uploaded_by: user)).not_to be_valid
  end

  it "is used by the post whose body references it" do
    markdown_image = upload_image

    post = create(:post, body: "look at this ![logo](#{markdown_image.url})")

    expect(post.markdown_images).to eq [markdown_image]
  end

  # Cloning a competition copies its tabs' markdown verbatim, so the same file is
  # legitimately embedded in many records at once.
  it "can be used by several records at once" do
    markdown_image = upload_image
    markdown = "![logo](#{markdown_image.url})"

    first = create(:post, body: markdown)
    second = create(:post, body: markdown)

    expect(markdown_image.usages.map(&:attachable)).to contain_exactly(first, second)
  end

  it "loses only its own usage when one of several users is destroyed" do
    markdown_image = upload_image
    markdown = "![logo](#{markdown_image.url})"

    create(:post, body: markdown)
    second = create(:post, body: markdown)

    expect { second.destroy! }.not_to change(MarkdownImage, :count)
    expect(markdown_image.usages.count).to eq 1
  end

  # 60% of the image references in production are of this shape.
  it "is used by both competitions when a competition with an image in a tab is cloned" do
    markdown_image = upload_image
    competition = create(:competition)
    create(:competition_tab, competition: competition, content: "![logo](#{markdown_image.url})")

    clone = competition.build_clone
    clone.name = "Cloned Competition 2016"
    clone.start_date, clone.end_date = [1.month.from_now.strftime("%F")] * 2
    clone.save!

    expect(markdown_image.usages.count).to eq 2
    expect(clone.tabs.first.markdown_images).to eq [markdown_image]
  end

  it "drops the usage when the image is edited out of the markdown" do
    markdown_image = upload_image
    post = create(:post, body: "![logo](#{markdown_image.url})")

    post.update!(body: "no image any more")

    expect(post.reload.markdown_images).to be_empty
    expect(markdown_image.reload).to be_persisted
  end

  it "reports images nothing references any more" do
    markdown_image = upload_image
    post = create(:post, body: "![logo](#{markdown_image.url})")

    expect(MarkdownImage.unused).to be_empty

    post.destroy!

    expect(MarkdownImage.unused).to eq [markdown_image]
  end

  describe "visibility" do
    it "defaults to private, so a form that forgets to say cannot leak" do
      expect(MarkdownImage.new.visibility).to eq "private"
    end

    it "puts the file in the bucket matching its visibility" do
      expect(upload_image(visibility: :public).public_image).to be_attached
      expect(upload_image(visibility: :private).private_image).to be_attached
    end

    it "serves a public image from the CDN and a private one through the controller" do
      expect(upload_image(visibility: :private).url).to include "markdown-images/"
      expect(upload_image(visibility: :public).url).not_to include "markdown-images/"
    end
  end

  describe "#viewable_by?" do
    let(:delegate) { create(:delegate) }
    let(:report) { create(:competition, :with_delegate_report, delegates: [delegate]).delegate_report }

    it "shows a public image to anyone, signed out included" do
      expect(upload_image(visibility: :public).viewable_by?(nil)).to be true
    end

    it "hides a private image from a signed-out visitor" do
      expect(upload_image(visibility: :private).viewable_by?(nil)).to be false
    end

    it "hides a private image from an unrelated user" do
      markdown_image = upload_image(visibility: :private)
      report.update!(summary: "![photo](#{markdown_image.url})")

      expect(markdown_image.reload.viewable_by?(create(:user))).to be false
    end

    it "shows a private image to someone who can read the report that embeds it" do
      markdown_image = upload_image(visibility: :private)
      report.update!(summary: "![photo](#{markdown_image.url})")

      expect(markdown_image.reload.viewable_by?(delegate)).to be true
    end

    it "shows the uploader their own image while the record is still a draft" do
      expect(upload_image(visibility: :private).viewable_by?(user)).to be true
    end

    # A private upload pasted into a public tab becomes readable through it.
    it "follows the most permissive record that embeds it" do
      markdown_image = upload_image(visibility: :private)
      create(:post, body: "![photo](#{markdown_image.url})")

      expect(markdown_image.reload.viewable_by?(create(:user))).to be true
    end
  end
end
