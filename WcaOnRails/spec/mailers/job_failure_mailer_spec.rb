require "rails_helper"

RSpec.describe JobFailureMailer, type: :mailer do
  describe "notify_admin_of_job_failure" do
    let(:job) { Delayed::Job.new(id: 42, handler: "I tried to take care of this") }
    let(:exception) do
      begin
        raise "error!"
      rescue Exception => e
        return e
      end
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
    end
  end
end
