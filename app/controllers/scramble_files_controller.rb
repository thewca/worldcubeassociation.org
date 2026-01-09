# frozen_string_literal: true

require 'fileutils'

class ScrambleFilesController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_upload_competition_results?, competition_from_params) }, except: :destroy

  def index
    competition = competition_from_params

    render json: ScrambleFileUpload.for_serialization.where(competition: competition)
  end

  def create
    competition = competition_from_params

    tnoodle_params = params.expect(tnoodle: [:json])
    uploaded_file = tnoodle_params[:json]

    matching_settings_params = params.expect(matching_settings: %i[is_enabled is_restricted])

    matching_enabled = ActiveRecord::Type::Boolean.new.cast(matching_settings_params[:is_enabled])
    matching_restricted = ActiveRecord::Type::Boolean.new.cast(matching_settings_params[:is_restricted])

    raw_file_contents = uploaded_file.read
    tnoodle_json = JSON.parse(raw_file_contents, symbolize_names: true)

    generation_date = DateTime.strptime(tnoodle_json[:generationDate], ScrambleFileUpload::TNOODLE_DATETIME_FORMAT)
    tnoodle_version = tnoodle_json[:version]

    existing_upload = ScrambleFileUpload.for_serialization.find_by(
      competition: competition,
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

    scr_file_upload = ScrambleFileUpload.for_serialization.create!(
      uploaded_by_user: current_user,
      uploaded_at: DateTime.now,
      competition: competition,
      original_filename: uploaded_file.original_filename,
      scramble_program: tnoodle_version,
      generated_at: generation_date,
      raw_wcif: tnoodle_wcif,
    )

    scr_file_upload.transaction do
      tnoodle_wcif[:events].each do |wcif_event|
        competition_event = competition.competition_events.find_by(event_id: wcif_event[:id])

        wcif_event[:rounds].each_with_index do |wcif_round, rd_idx|
          parsed_round_number = ScheduleActivity.parse_activity_code(wcif_round[:id]).fetch(:round_number, rd_idx + 1)
          competition_round = competition_event&.rounds&.find { it.wcif_id == wcif_round[:id] }

          round_scope = {
            competition_id: competition_round&.competition_id || competition.id,
            event_id: competition_round&.event_id || wcif_event[:id],
            round_number: competition_round&.number || parsed_round_number,
          }

          highest_ordered_index = InboxScrambleSet.where(**round_scope).maximum(:ordered_index)
          ordered_index_offset = highest_ordered_index&.succ || 0

          wcif_round[:scrambleSets].each_with_index do |wcif_scramble_set, idx|
            round_overmatched = competition_round.blank? || ordered_index_offset >= competition_round.scramble_set_count
            matched_round = competition_round if matching_enabled && (!matching_restricted || !round_overmatched)

            scramble_set = scr_file_upload.inbox_scramble_sets.create!(
              scramble_set_number: idx + 1,
              ordered_index: ordered_index_offset + idx,
              matched_round: matched_round,
              **round_scope,
            )

            %i[scrambles extraScrambles].each do |scramble_kind|
              num_persisted_scrambles = scramble_set.inbox_scrambles.count
              num_persisted_regular_scrambles = scramble_set.inbox_scrambles.not_extra.count

              wcif_scramble_set[scramble_kind].each_with_index do |wcif_scramble, n|
                set_overmatched = competition_round.blank? || num_persisted_regular_scrambles > competition_round.format.expected_solve_count
                matched_scramble_set = scramble_set if matching_enabled && (!matching_restricted || !set_overmatched)

                scramble_set.inbox_scrambles.create!(
                  scramble_string: wcif_scramble,
                  scramble_number: n + 1,
                  ordered_index: num_persisted_scrambles + n,
                  is_extra: scramble_kind == :extraScrambles,
                  matched_scramble_set: matched_scramble_set,
                )
              end
            end
          end
        end
      end
    end

    render json: scr_file_upload, status: :created
  end

  def destroy
    scramble_file_id = params.require(:id)
    scramble_upload = ScrambleFileUpload.find(scramble_file_id)

    return head :not_found if scramble_upload.blank?

    destroyed_file = scramble_upload.destroy

    render json: destroyed_file
  end

  def update_round_matching
    competition = competition_from_params

    competition.transaction do
      competition.rounds.each do |round|
        updated_round = params[round.wcif_id]

        next if updated_round.blank?

        updated_set_count = updated_round[:scramble_set_count]
        round.update!(scramble_set_count: updated_set_count)

        updated_sets = updated_round[:scramble_sets]

        updated_set_ids = updated_sets.pluck(:id)
        updated_sets_by_id = updated_sets.index_by { it[:id] }

        round.matched_scramble_sets.update_all(matched_round_id: nil)

        # This avoids validation issues when reassigning the indices one by one in the `each` loop below
        InboxScrambleSet.where(id: updated_set_ids).update_all(ordered_index: -1)

        InboxScrambleSet.find(updated_set_ids)
                        .each_with_index do |scramble_set, set_idx|
          scramble_set.update!(matched_round: round, ordered_index: set_idx)

          updated_scramble_ids = updated_sets_by_id[scramble_set.id][:inbox_scrambles]
          scramble_set.matched_inbox_scrambles.update_all(matched_scramble_set_id: nil)

          # This avoids validation issues when reassigning the indices one by one in the `each` loop below
          InboxScramble.where(id: updated_scramble_ids).update_all(ordered_index: -1)

          InboxScramble.find(updated_scramble_ids)
                       .each_with_index do |scramble, idx|
            scramble.update!(matched_scramble_set: scramble_set, ordered_index: idx)
          end
        end
      end
    end

    render json: competition.inbox_scramble_sets
                            .includes(**InboxScrambleSet::SERIALIZATION_INCLUDES)
  end

  private def competition_from_params
    Competition.find(params[:competition_id])
  end
end
