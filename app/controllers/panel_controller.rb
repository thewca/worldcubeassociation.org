# frozen_string_literal: true

class PanelController < ApplicationController
  include DocumentsHelper

  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:has_permission?, 'can_access_panels', params[:panel_id].to_sym) }, only: [:index]
  before_action -> { redirect_to_root_unless_user(:has_permission?, 'can_access_panels', :admin) }, only: [:generate_db_token]
  before_action -> { redirect_to_root_unless_user(:can_access_senior_delegate_panel?) }, only: [:pending_claims_for_subordinate_delegates]

  def pending_claims_for_subordinate_delegates
    # Show pending claims for a given user, or the current user, if they can see them
    user_id = params[:user_id] || current_user.id
    @user = User.find(user_id)
    @subordinate_delegates = @user.subordinate_delegates.to_a.push(@user)
  end

  def index
    @panel_id = params.require(:panel_id)
    panel_details = User.panel_list[@panel_id.to_sym]
    @pages = panel_details[:pages]
    @title = panel_details[:name]
    # This awkward mapping is necessary because `panel_notifications` returns callables
    #   which compute the value _if needed_. The point is to reduce workload, not every time
    #   that `User.panel_notifications` is called should trigger an actual computation.
    @notifications = User.panel_notifications.slice(*@pages).transform_values(&:call)
  end

  def generate_db_token
    @user_name, @db_endpoints = current_user.rds_credentials

    role_credentials = Aws::ECSCredentials.new
    token_generator = Aws::RDS::AuthTokenGenerator.new credentials: role_credentials

    @db_tokens = @db_endpoints.transform_values do |url|
      token_generator.auth_token({
                                   endpoint: "#{url}:3306",
                                   user_name: @user_name,
                                   region: EnvConfig.AWS_REGION,
                                 })
    end

    @db_server_indices = {
      main: 1,
      replica: 2,
      dev_dump: 3,
    }
  end

  private def validators_for_competition_ids(competition_ids)
    validators = params.require(:selectedValidators).split(',').map do |validator_name|
      ResultsValidators::Utils.validator_class_from_name(validator_name)
    end

    apply_fix_when_possible = ActiveRecord::Type::Boolean.new.cast(params.require(:applyFixWhenPossible))
    check_real_results = ActiveRecord::Type::Boolean.new.cast(params.require(:checkRealResults))

    results_validator = ResultsValidators::CompetitionsResultsValidator.new(
      validators,
      check_real_results: check_real_results,
      apply_fixes: apply_fix_when_possible,
    )
    results_validator.validate(competition_ids)
    render json: {
      has_results: results_validator.any_results?,
      validators: results_validator.validators,
      infos: results_validator.infos,
      errors: results_validator.errors,
      warnings: results_validator.warnings,
    }
  end

  private def competitions_between(start_date, end_date)
    Competition.over
               .not_cancelled
               .between_dates(start_date, end_date)
               .order(:start_date)
  end

  def competition_count
    start_date = params.require(:startDate)
    end_date = params.require(:endDate)

    count = competitions_between(start_date, end_date).count
    render json: count
  end

  def validators_for_competition_list
    competition_ids = params.require(:competitionIds).split(',')
    validators_for_competition_ids(competition_ids)
  end

  def validators_for_competitions_in_range
    start_date = params.require(:startDate)
    end_date = params.require(:endDate)
    competition_ids = competitions_between(start_date, end_date).ids

    validators_for_competition_ids(competition_ids)
  end

  def panel_page
    panel_page_id = params.require(:id)
    panel_with_panel_page = current_user.panels_with_access&.find { |panel| User.panel_list[panel][:pages].include?(panel_page_id) }

    return head :unauthorized if panel_with_panel_page.nil?

    query_params = request.query_parameters.except(:id)
    redirect_to panel_index_path(panel_id: panel_with_panel_page, anchor: panel_page_id, **query_params)
  end

  def cronjob_details
    cronjob_name = params.require(:cronjob_name)
    render json: JobUtils.cronjob_statistics_from_cronjob_name(cronjob_name)
  end

  def cronjob_run
    cronjob_name = params.require(:cronjob_name)
    JobUtils.run_cronjob(cronjob_name)

    render json: JobUtils.cronjob_statistics_from_cronjob_name(cronjob_name)
  rescue WcaExceptions::NotPermitted => e
    render status: e.status, json: { error: e.to_s }
  end

  def cronjob_reset
    cronjob_name = params.require(:cronjob_name)
    JobUtils.reset_cronjob(cronjob_name)

    render json: JobUtils.cronjob_statistics_from_cronjob_name(cronjob_name)
  end
end
