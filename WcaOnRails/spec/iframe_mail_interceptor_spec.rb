# frozen_string_literal: true

require 'rails_helper'

class TestMailer < ApplicationMailer
  def send_mail(body)
    mail(
      to: "receiver@example.com",
      subject: "RSpec email",
      body: body,
    )
  end
end

RSpec.describe IframeMailInterceptor do
  it "repleaces iframes with corresponding links" do
    TestMailer.send_mail('<p><iframe src="https://www.worldcubeassociation.org"></iframe></p>').deliver_now
    body = ActionMailer::Base.deliveries.last.body.decoded
    expect(body).to eq '<p><a href="https://www.worldcubeassociation.org">https://www.worldcubeassociation.org</a></p>'
  end

  it "converts embedded YouTube video into normal URL" do
    TestMailer.send_mail('<p><iframe src="https://www.youtube.com/embed/VIDEO_ID"></iframe></p>').deliver_now
    body = ActionMailer::Base.deliveries.last.body.decoded
    expect(body).to eq '<p><a href="https://www.youtube.com/watch?v=VIDEO_ID">https://www.youtube.com/watch?v=VIDEO_ID</a></p>'
  end

  it "converts embedded Google Maps into normal URL" do
    TestMailer.send_mail('<p><iframe src="https://www.google.com/maps/embed/v1/place?key=API_KEY&q=USA"></iframe></p>').deliver_now
    body = ActionMailer::Base.deliveries.last.body.decoded
    expect(body).to eq '<p><a href="https://www.google.com/maps/search/USA">https://www.google.com/maps/search/USA</a></p>'
  end
end
