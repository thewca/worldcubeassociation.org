# frozen_string_literal: true

class DatabaseController < ApplicationController
  EXPORT_PUBLIC_FOLDER = Rails.root.join('public', 'export')
  README_TEMPLATE = 'database/public_results_readme'

  RESULTS_EXPORT_FOLDER = EXPORT_PUBLIC_FOLDER.join('results')
  DEVELOPER_EXPORT_FOLDER = EXPORT_PUBLIC_FOLDER.join('developer')

  SQL_FILENAME = "WCA_export.sql"
  README_FILENAME = "README.md"
  METADATA_FILENAME = "metadata.json"

  SQL_PERMALINK_FILE = "#{SQL_FILENAME}.zip".freeze
  TSV_PERMALINK_FILE = "WCA_export.tsv.zip"

  def results_export
    @sql_filename, @sql_filesize = _link_info SQL_PERMALINK_FILE
    @tsv_filename, @tsv_filesize = _link_info TSV_PERMALINK_FILE
  end

  def _link_info(permalink)
    full_permalink = RESULTS_EXPORT_FOLDER.join(permalink)

    actual_filename = File.basename File.readlink(full_permalink)
    # Manually resolve the relative link to be independent of runtime environments
    actual_file = RESULTS_EXPORT_FOLDER.join(actual_filename)

    filesize_bytes = File.size? actual_file

    [actual_filename, filesize_bytes]
  end

  def developer_export
  end

  def self.render_readme(rendering_engine, export_timestamp)
    locals = { long_date: export_timestamp, export_version: DatabaseDumper::PUBLIC_RESULTS_VERSION }

    if rendering_engine.respond_to?(:render_to_string)
      rendering_engine.render_to_string(partial: README_TEMPLATE, formats: :md, locals: locals)
    else
      rendering_engine.render(partial: README_TEMPLATE, formats: :md, locals: locals)
    end
  end
end
