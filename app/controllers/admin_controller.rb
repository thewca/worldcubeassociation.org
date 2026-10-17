# frozen_string_literal: true

require 'csv'

class AdminController < ApplicationController
  ILR_SHARE_MIN_COMPETITIONS = 5
  ILR_LAUNCH_DATE = Date.new(2026, 4, 1)

  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_admin_results?) }, except: %i[all_voters leader_senior_voters regional_voters]
  before_action -> { redirect_to_root_unless_user(:can_see_eligible_voters?) }, only: %i[all_voters leader_senior_voters regional_voters]

  def index
  end

  def merge_people
    @merge_people = MergePeople.new
  end

  def sanity_check
    @categories = SanityCheckCategory.all
  end

  def migration_dashboard
    @week = Date.current.all_week
    @adoption_months = (ILR_LAUNCH_DATE..Date.current).map(&:beginning_of_month).uniq

    internal_competition_ids = Competition.scoretaking_software_internal.select(:id)
    dual_round_competition_ids = Competition.joins(:rounds).where.not(rounds: { linked_round_id: nil }).select(:id)
    ilr_competitions = Competition.not_cancelled.scoretaking_software_internal.where(start_date: ..Date.current)
    @ilr_competitions_count = ilr_competitions.count
    @ilr_competitions_without_dual_rounds_count = ilr_competitions.where.not(id: dual_round_competition_ids).count
    @upcoming_ilr_competitions_count = Competition.not_cancelled.scoretaking_software_internal.where(start_date: @week.last.next_day..).count
    competitions_this_week = Competition.not_cancelled.between_dates(@week.first, @week.last)
    @competitions_this_week_count = competitions_this_week.count
    @ilr_competitions_this_week = competitions_this_week.scoretaking_software_internal.order_by_date
    @dual_round_competition_ids_this_week = @ilr_competitions_this_week.where(id: dual_round_competition_ids).ids
    @live_attempts_by_competition = LiveAttempt.unscoped
                                               .joins(live_result: :registration)
                                               .where(registrations: { competition_id: @ilr_competitions_this_week.ids })
                                               .group("registrations.competition_id")
                                               .count
    ilr_attempts = LiveAttempt.joins(live_result: :registration).where(registrations: { competition_id: internal_competition_ids })
    @live_attempts_count = ilr_attempts.count
    @live_attempts_this_week_count = ilr_attempts.where(created_at: @week).count
    @live_scoretakers_count = LiveResultHistoryEntry.joins(live_result: :registration)
                                                    .where(registrations: { competition_id: internal_competition_ids })
                                                    .distinct
                                                    .count(:entered_by_id)

    integrated_submissions = Competition.scoretaking_software_internal.where.not(results_submitted_at: nil)
    @integrated_submissions_count = integrated_submissions.count
    @integrated_posted_count = integrated_submissions.results_posted.count
    @integrated_posted_results_count = Result.where(competition_id: integrated_submissions.select(:id)).count
    @integrated_inbox_results_count = InboxResult.where(competition_id: integrated_submissions.select(:id)).count
    @uploaded_jsons_by_type = UploadedJson.group(:upload_type).count

    @scramble_file_uploads_count = ScrambleFileUpload.count
    @scramble_file_uploads_this_week_count = ScrambleFileUpload.where(uploaded_at: @week).count
    @scramble_upload_competitions_count = ScrambleFileUpload.distinct.count(:competition_id)
    @external_scrambles_count = ExternalScramble.count
    @posted_uploaded_scrambles_count = Scramble.where.not(external_scramble_id: nil).count
    @scramble_programs = ScrambleFileUpload.group(:scramble_program).count.sort_by { |_, count| -count }

    competitions_since_ilr_launch = Competition.not_cancelled.where(end_date: ILR_LAUNCH_DATE..Date.current.end_of_month)
    @scoretaking_software_counts = competitions_since_ilr_launch.group(:scoretaking_software).count

    month_of_end_date = "DATE_FORMAT(competitions.end_date, '%Y-%m')"
    @competitions_by_month = competitions_since_ilr_launch.group(month_of_end_date).count
    @ilr_competitions_by_month = competitions_since_ilr_launch.scoretaking_software_internal.where(start_date: ..Date.current).group(month_of_end_date).count
    @scramble_upload_competitions_by_month = competitions_since_ilr_launch.joins(:scramble_file_uploads).group(month_of_end_date).distinct.count(:id)

    started_competitions_since_ilr_launch = competitions_since_ilr_launch.where(start_date: ..Date.current)
    ilr_competitions_by_country = started_competitions_since_ilr_launch.scoretaking_software_internal.group(:country_id).count
    competitions_by_country = started_competitions_since_ilr_launch.where(country_id: ilr_competitions_by_country.keys).group(:country_id).count
    @ilr_adoption_by_country = ilr_competitions_by_country.filter_map do |country_id, ilr|
      total = competitions_by_country.fetch(country_id)
      [country_id, ilr, total] if total >= ILR_SHARE_MIN_COMPETITIONS
    end.sort_by { |_, ilr, total| -ilr.fdiv(total) }
  end

  def run_sanity_check
    sanity_check_category = SanityCheckCategory.find(params.require(:sanity_check_category_id))
    SanityCheckCategoryJob.perform_later(sanity_check_category)
    flash[:success] = "Sanity check job enqueued for category #{sanity_check_category.name}."
    redirect_to sanity_check_path
  end

  def add_exclusion
    sanity_check_id = params.require(:sanity_check_id)
    exclusion = params.require(:exclusion_json)

    created = SanityCheckExclusion.create(exclusion: exclusion, sanity_check_id: sanity_check_id)
    if created
      flash[:success] = "Added exclusion."
    else
      flash[:danger] = "Failed to add exclusion."
    end
    redirect_to sanity_check_path
  end

  def do_merge_people
    merge_params = params.expect(merge_people: %i[person1_wca_id person2_wca_id])
    @merge_people = MergePeople.new(merge_params)
    if @merge_people.do_merge
      flash.now[:success] = "Successfully merged #{@merge_people.person2_wca_id} into #{@merge_people.person1_wca_id}!"
      @merge_people = MergePeople.new
    else
      flash.now[:danger] = "Error merging"
    end
    render 'merge_people'
  end

  def new_results
    @competition = competition_from_params
    @results_validator = ResultsValidators::CompetitionsResultsValidator.create_full_validation
    @results_validator.validate(@competition.id)
  end

  def check_competition_results
    @competition = competition_from_params
  end

  def clear_results_submission
    # Just clear the "results_submitted_at" field to let the Delegate submit
    # the results again. We don't actually want to clear InboxResult and InboxPerson.
    @competition = competition_from_params

    if @competition.results_submitted? && !@competition.results_posted?
      ActiveRecord::Base.transaction do
        @competition.update!(results_submitted_at: nil)
        @competition.tickets_competition_result.update!(status: TicketsCompetitionResult.statuses[:aborted])
      end
      render status: :ok, json: { success: true }
    else
      render status: :unprocessable_content, json: {
        error: "Could not clear the results submission. Maybe results are already posted, or there is no submission.",
      }
    end
  end

  def delete_results_data
    competition = competition_from_params(associations: [:results, :scrambles, { rounds: %i[results scrambles] }])

    model = params.require(:model)

    if model == 'All'
      competition.results.destroy_all
      competition.scrambles.destroy_all
    else
      round = competition.rounds.find(params.require(:roundId))

      case model
      when Result.name
        round.results.destroy_all
      when Scramble.name
        round.scrambles.destroy_all
      else
        return render status: :bad_request, json: { error: "Invalid model: #{model}" }
      end
    end

    render status: :ok, json: { success: true }
  end

  def fix_results
    @result_selector = FixResultsSelector.new(
      person_id: params[:person_id],
      competition_id: params[:competition_id],
      event_id: params[:event_id],
      round_type_id: params[:round_type_id],
    )
  end

  def person_data
    @person = Person.current.find_by!(wca_id: params.require(:person_wca_id))

    render json: {
      name: @person.name,
      country_id: @person.country_id,
      gender: @person.gender,
      dob: @person.dob,
      incorrect_wca_id_claim_count: @person.incorrect_wca_id_claim_count,
    }
  end

  def override_regional_records
    action_params = params
                    .expect(check_regional_records_form: %i[competition_id event_id refresh_index])

    @check_records_request = CheckRegionalRecordsForm.new(action_params)
    @check_results = @check_records_request.run_check
  end

  def do_override_regional_records
    ActiveRecord::Base.transaction do
      params[:regional_record_overrides].each do |id_and_type, marker|
        next if %i[competition_id event_id].include? id_and_type.to_sym

        next if marker.blank?

        result_id, result_type = id_and_type.split('-')
        record_marker = :"regional_#{result_type}_record"

        Result.where(id: result_id).update_all(record_marker => marker)
      end
    end

    competition_id = params.dig(:regional_record_overrides, :competition_id)
    event_id = params.dig(:regional_record_overrides, :event_id)

    redirect_to panel_page_path(id: User.panel_pages[:checkRecords], competition_id: competition_id, event_id: event_id)
  end

  def all_voters
    voters User.eligible_voters, "all-wca-voters"
  end

  def leader_senior_voters
    voters User.leader_senior_voters, "leader-senior-wca-voters"
  end

  def regional_voters
    voters User.regional_voters, "regional-wca-voters"
  end

  private def voters(users, filename)
    csv = CSV.generate do |line|
      users.each do |user|
        line << ["password", user.id, user.email, user.name]
        # Helios requires a voter_type field that must be set to "password". Note this is the literal string,
        # the actual passwords used on elections are generated by Helios
      end
    end
    send_data csv, filename: "#{filename}-#{Time.now.utc.iso8601}.csv", type: :csv
  end

  private def competition_from_params(associations: {})
    Competition.includes(associations).find(params.require(:competition_id))
  end

  private def competition_list_from_string(competition_ids_string)
    competition_ids_string.split(',').uniq.compact
  end

  def complete_persons
    @competition_ids_string = params.fetch(:competition_ids, "")
    @competition_ids = competition_list_from_string(@competition_ids_string)
    @persons_to_finish = FinishUnfinishedPersons.search_persons(@competition_ids)

    return unless @persons_to_finish.empty?

    flash[:warning] = "There are no persons to complete for the selected competition"
    redirect_to panel_page_path(id: User.panel_pages[:createNewComers], competition_ids: @competition_ids)
  end

  def do_complete_persons
    # memoize all WCA IDs, especially useful if we have several identical semi-IDs in the same batch
    # (siblings with the same last name competing as newcomers at the same competition etc.)
    wca_id_index = Person.pluck(:wca_id)

    ActiveRecord::Base.transaction do
      params[:person_completions].each do |person_key, procedure|
        next if %i[competition_ids continue_batch].include? person_key.to_sym

        old_name, old_country, pending_person_id, pending_competition_id = person_key.split '|'

        case procedure[:action]
        when "skip"
          next
        when "create"
          new_semi_id = procedure[:new_semi_id]

          new_id, wca_id_index = FinishUnfinishedPersons.complete_wca_id(new_semi_id, wca_id_index)

          new_name = procedure[:new_name]
          new_country = procedure[:new_country]

          inbox_person = nil

          if pending_person_id.present?
            inbox_person = InboxPerson.find_by(id: pending_person_id, competition_id: pending_competition_id)

            old_name = inbox_person.name
            old_country = inbox_person.country_id
          end

          FinishUnfinishedPersons.insert_person(
            wca_id: new_id,
            name: new_name,
            country_id: new_country,
            gender: inbox_person&.gender,
            dob: inbox_person&.dob,
          )
          FinishUnfinishedPersons.adapt_results(pending_person_id.presence, old_name, old_country, new_id, new_name, new_country, pending_competition_id)
        else
          action, merge_id = procedure[:action].split '-'
          raise "Invalid action: #{action}" unless action == "merge"

          # Has to exist because otherwise there would be nothing to merge
          new_person = Person.find(merge_id)

          FinishUnfinishedPersons.adapt_results(pending_person_id.presence, old_name, old_country, new_person.wca_id, new_person.name, new_person.country_id, pending_competition_id)
        end
      end
    end

    continue_batch = params.dig(:person_completions, :continue_batch)
    continue_batch = ActiveRecord::Type::Boolean.new.cast(continue_batch)

    competition_ids = params.dig(:person_completions, :competition_ids)

    if continue_batch
      can_continue = FinishUnfinishedPersons.unfinished_results_scope(competition_list_from_string(competition_ids)).any?

      return redirect_to action: :complete_persons, competition_ids: competition_ids if can_continue
    end

    redirect_to panel_page_path(id: User.panel_pages[:createNewComers], competition_ids: competition_ids)
  end

  def peek_unfinished_results
    @person_name = params.require(:person_name)
    @country_id = params.require(:country_id)
    @person_id = params.require(:person_id)

    all_results = Result.select("results.*, FALSE AS `muted`")
                        .joins(:event, :round_type)
                        .includes(:round)
                        .where(
                          person_name: @person_name,
                          country_id: @country_id,
                          person_id: @person_id,
                        )
                        .order("events.rank, round_types.rank DESC")

    @results_by_competition = all_results.group_by(&:competition_id)
                                         .transform_keys { |id| Competition.find(id) }
  end
end
