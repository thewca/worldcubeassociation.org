# frozen_string_literal: true

class Api::V0::Results::ResultsController < Api::V0::ApiController
  REGION_WORLD = "world"
  YEARS_ALL = "all years"
  SHOW_100_PERSONS = "100 persons"
  SHOWS = ['mixed', 'slim', 'separate', 'history', 'mixed history'].freeze
  GENDERS = %w[Male Female].freeze
  SHOW_MIXED = "mixed"
  GENDER_ALL = "All"
  EVENTS_ALL = "all events"

  MODE_RANKINGS = "rankings"
  MODE_RECORDS = "records"

  private def support_old_links!
    params[:event_id]&.tr!("+", " ")

    params[:region]&.tr!("+", " ")

    params[:years]&.tr!("+", " ")
    params[:years] = nil if params[:years] == "all"

    params[:show]&.tr!("+", " ")
    params[:show]&.downcase!
    # We are not supporting the all option anymore!
    params[:show] = nil if params[:show]&.include?("all")
  end

  private def params_for_cache
    params.permit(:event_id, :region, :years, :show, :gender, :type).to_h.symbolize_keys
  end

  private def shared_constants_and_conditions
    @types = %w[single average]

    if params[:event_id] == EVENTS_ALL
      @event_condition = ""
    else
      event = Event.c_find!(params[:event_id])
      @event_condition = "AND event_id = '#{event.id}'"
    end

    @continent = Continent.c_find(params[:region])
    @country = Country.c_find_by_iso2(params[:region])
    if @continent.present?
      @region_condition = "AND results.country_id IN (#{@continent.country_ids.map { |id| "'#{id}'" }.join(',')})"
      @region_condition += " AND record_name IN ('WR', '#{@continent.record_name}')" if @is_history
    elsif @country.present?
      @region_condition = "AND results.country_id = '#{@country.id}'"
      @region_condition += " AND record_name <> ''" if @is_history
    else
      @region_condition = ""
      @region_condition += "AND record_name = 'WR'" if @is_history
    end

    @gender = params[:gender]
    @gender_condition = case params[:gender]
                        when "Male"
                          "AND gender = 'm'"
                        when "Female"
                          "AND gender = 'f'"
                        else
                          ""
                        end
  end
end
