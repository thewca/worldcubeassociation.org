# frozen_string_literal: true

class Api::V0::ApiController < ApplicationController
  include Rails::Pagination

  include NewRelic::Agent::Instrumentation::ControllerInstrumentation if Rails.env.production?
  rate_limit to: 60, within: 1.minute if Rails.env.production?
  protect_from_forgery with: :null_session
  before_action :doorkeeper_authorize!, only: [:me]
  rescue_from WcaExceptions::ApiException do |e|
    render status: e.status, json: { error: e.to_s }
  end

  # Probably nicer to have some kind of errorcode/string depending on the model
  rescue_from ActiveRecord::RecordNotFound do |e|
    render json: { error: e.to_s, data: { model: e.model, id: e.id } }, status: :not_found
  end

  DEFAULT_API_RESULT_LIMIT = 20

  def me
    render json: { me: current_api_user }, private_attributes: doorkeeper_token.scopes
  end

  def healthcheck
    render json: { status: "ok", api_instance: EnvConfig.API_ONLY? }
  end

  def auth_results
    return render status: :unauthorized, json: { error: "Please log in" } unless current_user
    return render status: :forbidden, json: { error: "Cannot adminster results" } unless current_user.can_admin_results?

    render json: { status: "ok" }
  end

  def user_qualification_data
    date = cutoff_date
    return render json: { error: 'Invalid date format. Please provide an iso8601 date string.' }, status: :bad_request if date.blank?
    return render json: { error: 'You cannot request qualification data for a future date.' }, status: :bad_request if date > Date.current

    user = User.find(params.require(:user_id))

    render json: Registrations::Helper.user_qualification_data(user, date)
  end

  private def cutoff_date
    if params[:date].present?
      Date.safe_parse(params[:date])
    else
      Date.current
    end
  end

  def scramble_program
    begin
      rsa_key = OpenSSL::PKey::RSA.new(AppSecrets.TNOODLE_PUBLIC_KEY)
      raw_bytes = rsa_key.public_key.to_der

      public_key_base = Base64.encode64(raw_bytes)

      # DER format export from Ruby contains newlines which we don't want
      public_key = public_key_base.gsub(/\s+/, "")
    rescue OpenSSL::PKey::PKeyError
      public_key = false
    end

    render json: {
      "current" => {
        "name" => "TNoodle-WCA-1.2.3",
        "information" => "#{root_url}regulations/scrambles/",
        "download" => "https://github.com/thewca/tnoodle/releases/download/v1.2.3/TNoodle-WCA-1.2.3.jar",
      },
      "allowed" => [
        "TNoodle-WCA-1.2.3",
      ],
      "publicKeyBytes" => public_key,
      "history" => [
        "TNoodle-0.7.4",
        "TNoodle-0.7.5",
        "TNoodle-0.7.8",
        "TNoodle-0.7.12",
        "TNoodle-WCA-0.8.0",
        "TNoodle-WCA-0.8.1",
        "TNoodle-WCA-0.8.2",
        "TNoodle-WCA-0.8.4",
        "TNoodle-WCA-0.9.0",
        "TNoodle-WCA-0.10.0",
        "TNoodle-WCA-0.11.1",
        "TNoodle-WCA-0.11.3",
        "TNoodle-WCA-0.11.5",
        "TNoodle-WCA-0.12.0",
        "TNoodle-WCA-0.13.1",
        "TNoodle-WCA-0.13.2",
        "TNoodle-WCA-0.13.3",
        "TNoodle-WCA-0.13.4",
        "TNoodle-WCA-0.13.5",
        "TNoodle-WCA-0.14.0",
        "TNoodle-WCA-0.15.0",
        "TNoodle-WCA-0.15.1",
        "TNoodle-WCA-1.0.1",
        "TNoodle-WCA-1.1.0",
        "TNoodle-WCA-1.1.1",
        "TNoodle-WCA-1.1.2",
        "TNoodle-WCA-1.1.3.1",
        "TNoodle-WCA-1.2.0",
        "TNoodle-WCA-1.2.1",
        "TNoodle-WCA-1.2.2",
        "TNoodle-WCA-1.2.3",
      ],
    }
  end

  def known_timezones
    render json: Country::SUPPORTED_TIMEZONES
  end

  def search(*models)
    query = params[:q]&.slice(0...SearchResultsController::SEARCH_QUERY_LIMIT)

    unless query
      render status: :bad_request, json: { error: "No query specified" }
      return
    end

    concise_results_date = ComputeAuxiliaryData.end_date || Date.current
    cache_key = ["search", *models, concise_results_date.iso8601, query]

    # Temporary fix to skip cache if this is requested from Edit Person script. Long term fix would
    # be to have an API which gives an option to force cache miss, but this API cannot be public,
    # instead should be private to the corresponding microservice.
    result = Rails.cache.fetch(cache_key, force: current_user&.results_team?) do
      ActiveRecord::Base.connected_to(role: :read_replica) do
        models.flat_map { |model| model.search(query, params: params).limit(DEFAULT_API_RESULT_LIMIT) }
      end
    end

    options = if current_user&.can_admin_results?
                {
                  private_attributes: %w[incorrect_wca_id_claim_count dob],
                }
              else
                {}
              end

    render status: :ok, json: { result: result.as_json(options) }
  end

  def posts_search
    search(Post)
  end

  def competitions_search
    search(Competition)
  end

  def users_search
    search(User)
  end

  def persons_search
    search(Person)
  end

  def regulations_search
    search(Regulation)
  end

  def incidents_search
    search(Incident)
  end

  def omni_search
    # We intentionally exclude Post, as our autocomplete ui isn't very useful with
    # them yet.
    params[:persons_table] = true
    search(Competition, User, Regulation, Incident)
  end

  def delegates
    paginate json: UserGroup.delegate_regions.flat_map(&:active_users)
  end

  def delegates_search_index
    # TODO: There is a `uniq` call at the end which I feel shouldn't be necessary?!
    #   Postponing investigation until the Roles system migration is complete.
    all_delegates = UserGroup.includes(active_users: [:current_avatar]).delegate_regions.flat_map(&:active_users).uniq

    search_index = all_delegates.map do |delegate|
      delegate.slice(:id, :name, :wca_id).merge({ thumb_url: delegate.avatar.thumbnail_url })
    end

    render json: search_index
  end

  def records
    concise_results_date = ComputeAuxiliaryData.end_date || Date.current
    cache_key = ["records", concise_results_date.iso8601]
    json = Rails.cache.fetch(cache_key) do
      records = ActiveRecord::Base.connection.exec_query <<-SQL.squish
        SELECT 'single' type, MIN(best) value, country_id, event_id
        FROM concise_single_results
        GROUP BY country_id, event_id
        UNION ALL
        SELECT 'average' type, MIN(average) value, country_id, event_id
        FROM concise_average_results
        GROUP BY country_id, event_id
      SQL
      records = records.to_a
      {
        world_records: records_by_event(records),
        continental_records: records.group_by { |record| Country.c_find(record["country_id"]).continent_id }.transform_values!(&method(:records_by_event)),
        national_records: records.group_by { |record| record["country_id"] }.transform_values!(&method(:records_by_event)),
      }
    end
    render json: json
  end

  def export_public
    timestamp = DumpPublicResultsDatabase.successful_start_date

    current_version_key = DatabaseDumper.current_results_export_version
    current_version_number = DatabaseDumper::RESULTS_EXPORT_VERSIONS[current_version_key][:metadata][:export_format_version]
    _, sql_filesize = DbDumpHelper.cached_results_export_info("sql", current_version_key, timestamp)
    _, tsv_filesize = DbDumpHelper.cached_results_export_info("tsv", current_version_key, timestamp)

    render json: {
      export_date: timestamp&.iso8601,
      export_version: current_version_number,
      sql_url: results_permalink_url(:v2, 'sql'),
      sql_filesize_bytes: sql_filesize,
      tsv_url: results_permalink_url(:v2, 'tsv'),
      tsv_filesize_bytes: tsv_filesize,
      developer_url: DbDumpHelper.public_s3_path(DbDumpHelper::DEVELOPER_EXPORT_SQL_PERMALINK),
      readme: DatabaseController.render_readme(self, DateTime.now, current_version_key),
    }
  end

  private def records_by_event(records)
    records.group_by { |record| record["event_id"] }.transform_values! do |event_records|
      event_records.group_by { |record| record["type"] }.transform_values! do |type_records|
        type_records.map { |record| record["value"] }.min
      end
    end
  end

  def authenticated_user
    current_api_user || current_user
  end

  # Find the user that owns the access token.
  # From: https://github.com/doorkeeper-gem/doorkeeper#authenticated-resource-owner
  private def current_api_user
    @current_api_user ||= User.find_by(id: doorkeeper_token&.resource_owner_id) if doorkeeper_token&.accessible?
  end

  private def require_user!
    raise WcaExceptions::MustLogIn.new if current_api_user.nil? && current_user.nil?

    current_api_user || current_user
  end

  def countries
    render json: Country.all
  end

  def competition_series
    competition_series = CompetitionSeries.find_by(wcif_id: params[:id])
    raise WcaExceptions::NotFound.new("Competition series with ID #{params[:id]} not found") if competition_series.blank? || competition_series.public_competitions.empty?

    render json: competition_series.to_wcif
  end
end
