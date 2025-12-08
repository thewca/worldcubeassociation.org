# frozen_string_literal: true

class DatabaseController < ApplicationController
  REGULATIONS_ENDDATE_2025 = "2025-12-31"
  def results_export
    flash[:warning] = I18n.t('database.results_export.deprecation_warning')
    @export_version = DatabaseDumper.current_results_export_version
    @sql_path, @sql_filesize = DbDumpHelper.cached_results_export_info("sql", :v2)
    @tsv_path, @tsv_filesize = DbDumpHelper.cached_results_export_info("tsv", :v2)

    @sql_filename = File.basename(@sql_path)
    @tsv_filename = File.basename(@tsv_path)
  end

  def sql_permalink
    if Date.today > Date.parse(REGULATIONS_ENDDATE_2025)
      return render json: {
        error: "gone",
        message: "v1 of the Results Export has been deprecated. Please update to v2 by referring to the README and links at: https://www.worldcubeassociation.org/export/results",
      }, status: :gone
    end

    url, = DbDumpHelper.cached_results_export_info("sql", :v1)
    redirect_to url, status: :moved_permanently, allow_other_host: true
  end

  def tsv_permalink
    if Date.today > Date.parse(REGULATIONS_ENDDATE_2025)
      return render json: {
        error: "gone",
        message: "v1 of the Results Export has been deprecated. Please update to v2 by referring to the README and links at: https://www.worldcubeassociation.org/export/results",
      }, status: :gone
    end

    url, = DbDumpHelper.cached_results_export_info("tsv", :v1)
    redirect_to url, status: :moved_permanently, allow_other_host: true
  end

  def results_permalink
    version = params.require(:version).to_sym
    file_type = params.require(:file_type)

    if Date.today > Date.parse(REGULATIONS_ENDDATE_2025) && version == :v1
      return render json: {
        error: "gone",
        message: "v1 of the Results Export has been deprecated. Please update to v2 by referring to the README and links at: https://www.worldcubeassociation.org/export/results",
      }, status: :gone
    end

    url, = DbDumpHelper.cached_results_export_info(file_type, version)
    redirect_to url, status: :moved_permanently, allow_other_host: true
  end

  def developer_export
    @rel_download_path = DbDumpHelper.public_s3_path(DbDumpHelper::DEVELOPER_EXPORT_SQL_PERMALINK)
  end

  def self.render_readme(rendering_engine, export_timestamp, version)
    locals = { long_date: export_timestamp, export_version: DatabaseDumper::RESULTS_EXPORT_VERSIONS[version][:version_number] }

    partial_filename = "database/#{version}_public_results_readme"
    if rendering_engine.respond_to?(:render_to_string)
      rendering_engine.render_to_string(partial: partial_filename, formats: :md, locals: locals)
    else
      rendering_engine.render(partial: partial_filename, formats: :md, locals: locals)
    end
  end
end
