# frozen_string_literal: true

DR2024_OLD_EQUIPMENT = "Gen 3 Timers:\nGen 4 Timers:\nGen 5 Timers:\n\nSpeed Stacks Displays:\nQiYi Displays:\n"

namespace :delegate_reports do
  desc "Migrate untouched 'legacy' reports to 'dr2024' format"
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

  desc "Introduce 'venue' section for reports in 'dr2024' format"
  task migrate_wg2024_venue: [:environment] do
    template_report = DelegateReport.new(version: :working_group_2024)
    template_report.md_section_defaults!

    venue_section_template = template_report.venue
                                            .gsub("\r\n", "\n")
                                            .gsub("\r", "\n")

    # Only consider reports that haven't been posted yet
    DelegateReport.where(posted_at: nil, version: :working_group_2024)
                  .find_each do |dr|
      puts "Migrating #{dr.id} (Competition '#{dr.competition_id}')"

      dr.venue = venue_section_template

      if dr.equipment.present?
        puts "  Overriding 'equipment' part in venue section"
        dr.venue.gsub!(DR2024_OLD_EQUIPMENT, dr.equipment)
      end

      dr.equipment = nil

      dr.save!
    end
  end
end
