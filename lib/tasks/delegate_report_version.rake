# frozen_string_literal: true

namespace :delegate_reports do
  desc "Copy devise_two_factor OTP secret from old format to new format"
  task migrate_wg2024: [:environment] do
    template_report = DelegateReport.new(version: :legacy)
    template_report.md_section_defaults!

    # Only consider reports that haven't been posted yet
    DelegateReport.where(posted_at: nil, version: :legacy)
                  .find_each do |dr|
      not_edited = dr.md_sections.all? do |section|
        dr.read_attribute(section) == template_report.read_attribute(section)
      end

      if not_edited
        puts "Migrating #{dr.id} (Competition '#{dr.competition_id}')"

        dr.version = :working_group_2024
        dr.md_section_defaults!

        dr.save!
      end
    end
  end
end
