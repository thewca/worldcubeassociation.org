# frozen_string_literal: true

class JobFailureMailer < ApplicationMailer
  def notify_admin_of_job_failure(job, exception)
    @exception = exception
    @job = job.stringify_keys
    mail(
      to: "admin@worldcubeassociation.org",
      reply_to: "admin@worldcubeassociation.org",
      subject: "Job #{@job['jid']} failed",
    )
  end
end
