# frozen_string_literal: true
# Copied from https://gist.github.com/koffeinfrei/8931935,
# and slightly modified.
namespace :db do
  namespace :data do
    desc 'Validates all records in the database'
    task :validate => :environment do
      original_log_level = ActiveRecord::Base.logger.level
      ActiveRecord::Base.logger.level = 1

      puts 'Validate database (this will take some time)...'

      # http://stackoverflow.com/a/10712838/1739415
      Rails.application.eager_load!

      error_count = 0
      ActiveRecord::Base.subclasses
        .reject { |type| type.to_s.include?('::') || type.to_s == "WiceGridSerializedQuery" }
        .each do |type|
          begin
            type.find_each do |record|
              unless record.valid?
                puts "#<#{ type } id: #{ record.id }, errors: #{ record.errors.full_messages }>"
                error_count += 1
              end
            end
          rescue StandardError => e
            puts "An exception occurred: #{ e.message }"
            error_count += 1
          end
        end

      ActiveRecord::Base.logger.level = original_log_level

      exit error_count > 0 ? 1 : 0
    end
  end
end
