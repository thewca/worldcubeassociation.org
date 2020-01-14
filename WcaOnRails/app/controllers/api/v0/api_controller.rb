# frozen_string_literal: true

class Api::V0::ApiController < ApplicationController
  include Rails::Pagination
  protect_from_forgery with: :null_session
  before_action :doorkeeper_authorize!, only: [:me]
  rescue_from WcaExceptions::ApiException do |e|
    render status: e.status, json: { error: e.to_s }
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

  def scramble_program
    render json: {
      "current" => {
        "name" => "TNoodle-WCA-0.15.1",
        "information" => "#{root_url}regulations/scrambles/",
        "download" => "#{root_url}regulations/scrambles/tnoodle/TNoodle-WCA-0.15.1.jar",
      },
      "allowed" => ["TNoodle-WCA-0.15.1"],
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
    result = models.flat_map { |model| model.search(query, params: params).limit(DEFAULT_API_RESULT_LIMIT) }
    render status: :ok, json: { result: result }
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

  def regulations_search
    search(Regulation)
  end

  def omni_search
    # We intentionally exclude Post, as our autocomplete ui isn't very useful with
    # them yet.
    params[:persons_table] = true
    search(Competition, User, Regulation)
  end

  def show_user(user)
    if user
      json = { user: user }
      if params[:upcoming_competitions]
        json[:upcoming_competitions] = user.registrations
                                           .accepted
                                           .includes(competition: [:delegates, :organizers, :events])
                                           .map(&:competition)
                                           .select(&:upcoming?)
      end
      render status: :ok, json: json
    else
      render status: :not_found, json: { user: nil }
    end
  end

  def show_user_by_id
    user = User.find_by_id(params[:id])
    show_user(user)
  end

  def show_user_by_wca_id
    user = User.find_by_wca_id(params[:wca_id])
    show_user(user)
  end

  def delegates
    paginate json: User.delegates
  end

  def records
    concise_results_date = Timestamp.find_by(name: "compute_auxiliary_data_end").date
    cache_key = "records/#{concise_results_date.iso8601}"
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
      records = records.to_hash
      {
        world_records: records_by_event(records),
        continental_records: records.group_by { |record| Country.c_find(record["country_id"]).continentId }.transform_values!(&method(:records_by_event)),
        national_records: records.group_by { |record| record["country_id"] }.transform_values!(&method(:records_by_event)),
      }
    end
    render json: json
  end

  def anonymous_age_rankings
    concise_results_date = Timestamp.find_by(name: "compute_auxiliary_data_end").date
    cache_key = "records/#{concise_results_date.iso8601}"
    # This query doesn't actually depend on the results of compute auxiliary
    # data, but the timestamp is still a good proxy for "when did results last
    # get uploaded?"
    json = Rails.cache.fetch(cache_key) do
      average_groups = self.get_anonymous_age_rankings "average"
      single_groups = self.get_anonymous_age_rankings "single"
      {
        average: average_groups,
        single: single_groups,
      }
    end
    render json: json
  end

  private def get_anonymous_age_rankings(result_type)
    raise unless ["single", "average"].include?(result_type)

    column_name = result_type == "single" ? "best" : result_type

    ActiveRecord::Base.connection.exec_query <<-SQL
        SELECT eventId AS event_id, age_category, group_number, COUNT(*) AS group_size, IF(COUNT(*) >= 4, FLOOR(AVG(best)), NULL) AS group_average
        FROM
        (
          SELECT personId, eventId, age_category, best,
                 FLOOR((ROW_NUMBER() OVER (PARTITION BY eventId, age_category ORDER BY best) - 1) / 6) AS group_number
          FROM
          (
            SELECT personId, eventId, age_category, MIN(#{column_name}) AS best
            FROM
            (
              SELECT r.personId, r.eventId, r.#{column_name}, TIMESTAMPDIFF(YEAR,
                DATE_FORMAT(CONCAT(p.year, '-', p.month, '-', p.day), '%Y-%m-%d'),
                DATE_FORMAT(CONCAT(c.year, '-', c.month, '-', c.day), '%Y-%m-%d')) AS age_at_comp
              FROM Persons AS p USE INDEX()
              JOIN Results AS r ON r.personId = p.id AND #{column_name} > 0
              JOIN Competitions AS c ON c.id = r.competitionId
              WHERE p.year > 0 AND p.year <= YEAR(CURDATE()) - 40
              AND p.subid = 1
              HAVING age_at_comp >= 40
            ) AS senior_results
            JOIN
            (
              SELECT 40 AS age_category
              UNION ALL SELECT 50 UNION ALL SELECT 60 UNION ALL SELECT 70 UNION ALL SELECT 80 UNION ALL SELECT 90 UNION ALL SELECT 100
            ) AS age_categories ON age_category <= age_at_comp
            GROUP BY personId, eventId, age_category
          ) AS senior_bests
        ) AS group_bests
        GROUP BY eventId, age_category, group_number
    SQL
  end

  def export_public
    sql_zips = Dir.glob(Rails.root.join("../webroot/results/misc/*.sql.zip")).sort!
    tsv_zips = Dir.glob(Rails.root.join("../webroot/results/misc/*.tsv.zip")).sort!

    last_sql = File.basename(sql_zips.last)
    last_tsv = File.basename(tsv_zips.last)
    m = /WCA_export(\d+)_(.*).sql.zip/.match(last_sql)
    date = Time.parse(m[2])

    render json: {
      export_date: date.iso8601,
      sql_url: "#{root_url}results/misc/#{last_sql}",
      tsv_url: "#{root_url}results/misc/#{last_tsv}",
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
end
