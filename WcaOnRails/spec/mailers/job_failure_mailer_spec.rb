# frozen_string_literal: true

require "rails_helper"

RSpec.describe JobFailureMailer, type: :mailer do
  describe "notify_admin_of_job_failure" do
    let(:job) { { jid: 42, args: "I tried to take care of this" } }
    let(:exception) do
      RuntimeError.new("error!").tap { |e| e.set_backtrace(["stack level 1", "stack level 2"]) }
    end
    let(:mail) { JobFailureMailer.notify_admin_of_job_failure(job, exception) }

    it "renders the headers" do
      expect(mail.subject).to eq("Job 42 failed")
      expect(mail.to).to eq(["admin@worldcubeassociation.org"])
      expect(mail.reply_to).to eq(["admin@worldcubeassociation.org"])
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("Job 42 failed")
      expect(mail.body.encoded).to match("Handler")
      expect(mail.body.encoded).to match("I tried to take care of this")
      expect(mail.body.encoded).to match("Backtrace")
      expect(mail.body.encoded).to match("<pre>stack level 1\r\nstack level 2</pre>")
    end
  end
end
