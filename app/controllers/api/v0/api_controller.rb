# frozen_string_literal: true

class Api::V0::ApiController < ApplicationController
  include Rails::Pagination
  include NewRelic::Agent::Instrumentation::ControllerInstrumentation if Rails.env.production?
  protect_from_forgery with: :null_session
  before_action :doorkeeper_authorize!, only: [:me]
  rescue_from WcaExceptions::ApiException do |e|
    render status: e.status, json: { error: e.to_s }
  end

  rescue_from ActiveRecord::RecordNotFound do |e|
    render status: :not_found, json: { error: e.to_s }
  end

  DEFAULT_API_RESULT_LIMIT = 20

  def me
    render json: { me: current_api_user }, private_attributes: doorkeeper_token.scopes
  end

  def auth_results
    if !current_user
      return render status: :unauthorized, json: { error: "Please log in" }
    end
    if !current_user.can_admin_results?
      return render status: :forbidden, json: { error: "Cannot adminster results" }
    end

    render json: { status: "ok" }
  end

  def user_qualification_data
    date = cutoff_date
    return render json: { error: 'Invalid date format. Please provide an iso8601 date string.' }, status: :bad_request unless date.present?
    return render json: { error: 'You cannot request qualification data for a future date.' }, status: :bad_request if date > Date.current

    user = User.find(params.require(:user_id))
    return render json: [] unless user.person.present?

    # Compile singles
    best_singles_by_cutoff = user.person.best_singles_by(date)
    single_qualifications = best_singles_by_cutoff.map do |event, time|
      qualification_data(event, :single, time, date)
    end

    # Compile averages
    best_averages_by_cutoff = user.person&.best_averages_by(date)
    average_qualifications = best_averages_by_cutoff.map do |event, time|
      qualification_data(event, :average, time, date)
    end

    render json: single_qualifications + average_qualifications
  end

  private def cutoff_date
    if params[:date].present?
      Date.safe_parse(params[:date])
    else
      Date.current
    end
  end

  private def qualification_data(event, type, time, date)
    raise ArgumentError.new("'type' may only contain the symbols `:single` or `:average`") unless [:single, :average].include?(type)
    {
      eventId: event,
      type: type,
      best: time,
      on_or_before: date.iso8601,
    }
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
        "name" => "TNoodle-WCA-1.2.2",
        "information" => "#{root_url}regulations/scrambles/",
        "download" => "#{root_url}regulations/scrambles/tnoodle/TNoodle-WCA-1.2.2.jar",
      },
      "allowed" => [
        "TNoodle-WCA-1.1.3.1",
        "TNoodle-WCA-1.2.0",
        "TNoodle-WCA-1.2.1",
        "TNoodle-WCA-1.2.2",
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
      ],
    }
  end

  def help
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

    if current_user && current_user.can_admin_results?
      options = {
        private_attributes: %w[incorrect_wca_id_claim_count dob],
      }
    else
      options = {}
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
    all_delegates = UserGroup.includes(:active_users).delegate_regions.flat_map(&:active_users).uniq

    search_index = all_delegates.map do |delegate|
      delegate.slice(:id, :name, :wca_id).merge({ thumb_url: delegate.avatar.url(:thumb) })
    end

    render json: search_index
  end

  def records
    concise_results_date = ComputeAuxiliaryData.end_date || Date.current
    cache_key = ["records", concise_results_date.iso8601]
    json = Rails.cache.fetch(cache_key) do
      records = ActiveRecord::Base.connection.exec_query <<-SQL
        SELECT 'single' type, MIN(best) value, countryId country_id, eventId event_id
        FROM ConciseSingleResults
        GROUP BY countryId, eventId
        UNION ALL
        SELECT 'average' type, MIN(average) value, countryId country_id, eventId event_id
        FROM ConciseAverageResults
        GROUP BY countryId, eventId
      SQL
      records = records.to_a
      {
        world_records: records_by_event(records),
        continental_records: records.group_by { |record| Country.c_find(record["country_id"]).continentId }.transform_values!(&method(:records_by_event)),
        national_records: records.group_by { |record| record["country_id"] }.transform_values!(&method(:records_by_event)),
      }
    end
    render json: json
  end

  def export_public
    timestamp = DumpPublicResultsDatabase.start_date

    render json: {
      export_date: timestamp&.iso8601,
      sql_url: "#{sql_permalink_url}.zip",
      tsv_url: "#{tsv_permalink_url}.zip",
    }
  end

  private def records_by_event(records)
    records.group_by { |record| record["event_id"] }.transform_values! do |event_records|
      event_records.group_by { |record| record["type"] }.transform_values! do |type_records|
        type_records.map { |record| record["value"] }.min
      end
    end
  end

  # Find the user that owns the access token.
  # From: https://github.com/doorkeeper-gem/doorkeeper#authenticated-resource-owner
  private def current_api_user
    return @current_api_user if defined?(@current_api_user)

    @current_api_user = User.find_by_id(doorkeeper_token&.resource_owner_id)
  end

  private def require_user!
    raise WcaExceptions::MustLogIn.new if current_api_user.nil? && current_user.nil?
    current_api_user || current_user
  end

  def countries
    render json: Country.all
  end

  def competition_series
    competition_series = CompetitionSeries.find_by_wcif_id(params[:id])
    if !competition_series.present? || competition_series.public_competitions.empty?
      raise WcaExceptions::NotFound.new("Competition series with ID #{params[:id]} not found")
    end
    render json: competition_series.to_wcif
  end
end
