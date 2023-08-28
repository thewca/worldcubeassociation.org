# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/job_failure_mailer
class JobFailureMailerPreview < ActionMailer::Preview
  def notify_admin_of_job_failure
    job = {
      jid: '4242',
      args: %w[some random arguments],
    }
    begin
      raise "This is an error!"
    rescue StandardError => e
      exception = e
    end
    JobFailureMailer.notify_admin_of_job_failure(job, exception)
  end
end
