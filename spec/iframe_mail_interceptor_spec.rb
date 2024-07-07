# frozen_string_literal: true

require 'rails_helper'

class TestMailer < ApplicationMailer
  def send_mail(body)
    mail(
      to: 'receiver@example.com',
      subject: 'RSpec email',
    ) do |format|
      format.html { render html: body.html_safe }
    end
  end

  def send_mail_with_attachment(body)
    attachments['attachment.rb'] = File.read(__FILE__)
    send_mail(body)
  end
end

RSpec.describe IframeMailInterceptor do
  it 'replaces iframes with corresponding links' do
    TestMailer.send_mail('<p><iframe src="https://www.worldcubeassociation.org"></iframe></p>').deliver_now
    body = ActionMailer::Base.deliveries.last.html_part.body.decoded
    expect(body).to include '<p><a href="https://www.worldcubeassociation.org">https://www.worldcubeassociation.org</a></p>'
  end

  it 'converts embedded YouTube video into normal URL' do
    TestMailer.send_mail('<p><iframe src="https://www.youtube.com/embed/VIDEO_ID"></iframe></p>').deliver_now
    body = ActionMailer::Base.deliveries.last.html_part.body.decoded
    expect(body).to include '<p><a href="https://www.youtube.com/watch?v=VIDEO_ID">https://www.youtube.com/watch?v=VIDEO_ID</a></p>'
  end

  it 'converts embedded Google Maps into normal URL' do
    TestMailer.send_mail('<p><iframe src="https://www.google.com/maps/embed/v1/place?key=API_KEY&q=USA"></iframe></p>').deliver_now
    body = ActionMailer::Base.deliveries.last.html_part.body.decoded
    expect(body).to include '<p><a href="https://www.google.com/maps/search/USA">https://www.google.com/maps/search/USA</a></p>'
  end

  it 'works when attachments are present' do
    TestMailer.send_mail_with_attachment('<p><iframe src="https://www.worldcubeassociation.org"></iframe></p>').deliver_now
    body = ActionMailer::Base.deliveries.last.html_part.body.decoded
    expect(body).to include '<p><a href="https://www.worldcubeassociation.org">https://www.worldcubeassociation.org</a></p>'
    expect(ActionMailer::Base.deliveries.last.attachments.length).to eq 1
  end
end
