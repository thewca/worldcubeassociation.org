# frozen_string_literal: true

require 'rails_helper'

RSpec.describe MarkdownImage do
  let(:user) { create(:user) }

  def new_image(fixture, content_type)
    MarkdownImage.new(uploaded_by: user).tap do |markdown_image|
      markdown_image.image.attach(io: File.open("spec/support/#{fixture}"), filename: fixture, content_type: content_type)
    end
  end

  it "accepts a web image" do
    expect(new_image('logo.png', 'image/png')).to be_valid
  end

  it "rejects a file that is not a web image" do
    expect(new_image('bylaws.pdf', 'application/pdf')).not_to be_valid
  end

  # The content type the client declares is attacker-controlled, so it is not
  # what the validation may go on.
  it "rejects a file that only claims to be a web image" do
    expect(new_image('bylaws.pdf', 'image/png')).not_to be_valid
  end

  it "rejects a record with no file at all" do
    expect(MarkdownImage.new(uploaded_by: user)).not_to be_valid
  end
end
