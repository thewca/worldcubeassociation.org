# frozen_string_literal: true

class DatabaseController < ApplicationController
  _EXPORT_PUBLIC_FOLDER = Rails.root.join('public', 'export')

  RESULTS_EXPORT_FOLDER = _EXPORT_PUBLIC_FOLDER.join('results')
  DEVELOPER_EXPORT_FOLDER = _EXPORT_PUBLIC_FOLDER.join('developer')

  SQL_PERMALINK_FILE = "WCA_export.sql.zip"
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

  def developer_export; end
end
