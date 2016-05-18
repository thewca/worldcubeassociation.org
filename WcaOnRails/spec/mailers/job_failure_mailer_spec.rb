require "rails_helper"

RSpec.describe JobFailureMailer, type: :mailer do
  describe "notify_admin_of_job_failure" do
    let(:job) { Delayed::Job.new(id: 42) }
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
    end
  end
end
