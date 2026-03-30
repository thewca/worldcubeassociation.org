# frozen_string_literal: true

require 'fileutils'

class ScrambleFilesController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_upload_competition_results?, competition_from_params) }, except: :destroy

  def index
    competition = competition_from_params

    render json: competition.scramble_file_uploads.for_serialization
  end

  def create
    competition = competition_from_params(associations: [:competition_events])

    tnoodle_params = params.expect(tnoodle: [:json])
    uploaded_file = tnoodle_params[:json]

    raw_file_contents = uploaded_file.read
    tnoodle_json = JSON.parse(raw_file_contents, symbolize_names: true)

    generation_date = DateTime.strptime(tnoodle_json[:generationDate], ScrambleFileUpload::TNOODLE_DATETIME_FORMAT)
    tnoodle_version = tnoodle_json[:version]

    existing_upload = competition.scramble_file_uploads.for_serialization.find_by(
      scramble_program: tnoodle_version,
      generated_at: generation_date,
    )

    return render json: existing_upload if existing_upload.present?

    tnoodle_wcif = tnoodle_json[:wcif].slice(
      :formatVersion,
      :id,
      :name,
      :shortName,
      :events,
    )

    scr_file_upload = competition.scramble_file_uploads.for_serialization.build(
      uploaded_by_user: current_user,
      original_filename: uploaded_file.original_filename,
      scramble_program: tnoodle_version,
      generated_at: generation_date,
      raw_wcif: tnoodle_wcif,
    )

    tnoodle_wcif[:events].each do |wcif_event|
      competition_event = competition.competition_events.find_by!(event_id: wcif_event[:id])

      wcif_event[:rounds].each_with_index do |wcif_round, rd_idx|
        parsed_round_number = ScheduleActivity.parse_activity_code(wcif_round[:id]).fetch(:round_number, rd_idx + 1)

        wcif_round[:scrambleSets].each_with_index do |wcif_scramble_set, idx|
          scramble_set = scr_file_upload.external_scramble_sets.build(
            competition_id: competition.id,
            event_id: competition_event.event_id,
            round_number: parsed_round_number,
            scramble_set_number: idx + 1,
          )

          %i[scrambles extraScrambles].each do |scramble_kind|
            wcif_scramble_set[scramble_kind].each_with_index do |wcif_scramble, n|
              scramble_set.external_scrambles.build(
                scramble_string: wcif_scramble,
                scramble_number: n + 1,
                is_extra: scramble_kind == :extraScrambles,
              )
            end
          end
        end
      end
    end

    scr_file_upload.save!

    render json: scr_file_upload, status: :created
  end

  def destroy
    scramble_file_id = params.require(:id)
    scramble_upload = ScrambleFileUpload.find_by(id: scramble_file_id)

    return head :not_found if scramble_upload.blank?

    destroyed_file = scramble_upload.destroy

    render json: destroyed_file
  end

  def update_round_matching
    competition = competition_from_params(associations: [:rounds])

    competition.transaction do
      # Rails does not do this for some reason, "because it goes through more than one other association"
      #   So instead, we resort to deleting individually per round, see more below
      # competition.matched_scramble_sets.delete_all

      competition.rounds.each do |round|
        round.matched_scramble_sets.delete_all

        updated_round = params[round.wcif_id]

        next if updated_round.blank?

        round.scramble_set_count = updated_round[:scramble_set_count]

        updated_round[:matched_scramble_sets].each_with_index do |ext_set, set_idx|
          matched_set = round.matched_scramble_sets.build(
            external_scramble_set_id: ext_set[:id],
            ordered_index: set_idx,
          )

          ext_set[:matched_scrambles].each_with_index do |ext_scr, scr_idx|
            matched_set.matched_scrambles.build(
              external_scramble_id: ext_scr[:id],
              ordered_index: scr_idx,
              scramble_string: ext_scr[:scramble_string],
              is_extra: ext_scr[:is_extra],
            )
          end
        end

        round.save!
      end
    end

    render json: competition.matched_scramble_sets.for_serialization
  end

  private def competition_from_params(associations: {})
    Competition.includes(associations).find(params[:competition_id])
  end
end
