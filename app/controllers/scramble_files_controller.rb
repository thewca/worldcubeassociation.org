# frozen_string_literal: true

require 'fileutils'

class ScrambleFilesController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_upload_competition_results?, competition_from_params) }, except: :destroy

  def index
    competition = competition_from_params

    existing_files = ScrambleFileUpload
                     .includes(inbox_scramble_sets: { inbox_scrambles: [], matched_round: [:competition_event] })
                     .where(competition: competition)

    render json: existing_files
  end

  def create
    competition = competition_from_params

    uploaded_file = params.require(:tnoodle).require(:json)

    raw_file_contents = uploaded_file.read
    tnoodle_json = JSON.parse(raw_file_contents, symbolize_names: true)

    # The original Java `LocalDateTime` format is defined as `"MMM dd, yyyy h:m:s a"`.
    generation_date = DateTime.strptime(tnoodle_json[:generationDate], "%b %d, %Y %l:%M:%S %p")
    tnoodle_version = tnoodle_json[:version]

    existing_upload = ScrambleFileUpload
                      .includes(inbox_scramble_sets: { inbox_scrambles: [], matched_round: [:competition_event] })
                      .find_by(
                        competition: competition,
                        scramble_program: tnoodle_version,
                        generated_at: generation_date,
                      )

    return render json: existing_upload if existing_upload.present?

    tnoodle_wcif = tnoodle_json[:wcif]

    scr_file_upload = ScrambleFileUpload.create!(
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

        wcif_event[:rounds].each do |wcif_round|
          competition_round = competition_event.rounds.find { it.wcif_id == wcif_round[:id] }

          wcif_round[:scrambleSets].each_with_index do |wcif_scramble_set, idx|
            scramble_set = scr_file_upload.inbox_scramble_sets.create!(
              ordered_index: idx,
              matched_round: competition_round,
            )

            %i[scrambles extraScrambles].each do |scramble_kind|
              wcif_scramble_set[scramble_kind].each_with_index do |wcif_scramble, n|
                scramble_set.inbox_scrambles.create!(
                  scramble_string: wcif_scramble,
                  scramble_number: n + 1,
                  is_extra: scramble_kind == :extraScramble,
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

    competition.rounds.each do |round|
      updated_set_ids = params[round.wcif_id]

      next if updated_set_ids.blank?

      scramble_size_offset = round.inbox_scramble_sets.count
      round.inbox_scramble_sets.update_all(matched_round_id: nil)

      changed_scramble_sets = InboxScrambleSet.find(updated_set_ids)

      # First pass: Set the ordered_index so ridiculously high that we won't have any collision
      changed_scramble_sets.each_with_index do |scramble_set, idx|
        scramble_set.update!(ordered_index: scramble_size_offset + idx)
      end

      # rubocop:disable Style/CombinableLoops
      # Second pass: Set the ordered_index to the actual value specified by the user
      changed_scramble_sets.each_with_index do |scramble_set, idx|
        scramble_set.update!(matched_round: round, ordered_index: idx)
      end
      # rubocop:enable Style/CombinableLoops
    end

    render json: { success: :ok }
  end

  private def competition_from_params
    Competition.find(params[:competition_id])
  end
end
