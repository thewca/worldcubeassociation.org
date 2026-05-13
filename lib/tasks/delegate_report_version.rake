# frozen_string_literal: true

namespace :delegate_reports do
  desc "Empty out columns of unposted Delegate reports where the section is exactly equal to the template"
  task clean_untouched_templates: [:environment] do
    DelegateReport.where(posted_at: nil).find_each do |dr|
      # This method is automatically called by a `before_save` hook (at the time of writing this comment).
      #   But we call it here explicitly to make it very clear and obvious what this Rake task does,
      #   in an effort to avoid head-scratching and git-blaming in the future.
      dr.clean_untouched_sections

      puts "Migrating #{dr.id} (Competition '#{dr.competition_id}')"
      dr.save!
    end
  end
end
