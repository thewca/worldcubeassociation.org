require 'delayed/plugins/save_completed_jobs'

Delayed::Worker.destroy_failed_jobs = false
Delayed::Worker.max_run_time = 5.minutes
Delayed::Worker.delay_jobs = !Rails.env.test?
Delayed::Worker.plugins << Delayed::Plugins::SaveCompletedJobs
