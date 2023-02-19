# frozen_string_literal: true

class DatabaseController < ApplicationController
  SQL_PERMALINK_FILE = "WCA_export.sql.zip"
  TSV_PERMALINK_FILE = "WCA_export.tsv.zip"

  def results_export
    @sql_filename, @sql_filesize = _link_info SQL_PERMALINK_FILE
    #@tsv_filename, @tsv_filesize = _link_info TSV_PERMALINK_FILE
  end

  def _link_info(permalink)
    full_permalink = Rails.root.join('public', 'export', 'results', permalink)

    actual_filename = File.basename File.readlink(full_permalink)
    # Manually resolve the relative link to be independent of runtime environments
    actual_file = Rails.root.join('public', 'export', 'results', actual_filename)

    filesize_bytes = File.size? actual_file

    [actual_filename, filesize_bytes]
  end

  def developer_export; end
end
