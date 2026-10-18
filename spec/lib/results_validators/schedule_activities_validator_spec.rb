# frozen_string_literal: true

require 'rails_helper'

RV = ResultsValidators
SAV = RV::ScheduleActivitiesValidator

RSpec.describe SAV do
  context "on InboxResult and Result" do
    let!(:competition) { create(:competition, :past, :with_valid_schedule, event_ids: %w[333]) }
    let(:validator_args) do
      [InboxResult, Result].flat_map do |model|
        [
          { competition_ids: [competition.id], model: model },
          { results: model.where(competition_id: competition.id), model: model },
        ]
      end
    end

    before do
      round = competition.rounds.first
      [Result, InboxResult].each do |model|
        create(model.model_name.singular.to_sym, competition: competition, event_id: "333", round: round)
      end
    end

    it "produces no warnings for a valid schedule" do
      validator_args.each do |arg|
        sav = SAV.new.validate(**arg)
        expect(sav.warnings).to be_empty
        expect(sav.errors).to be_empty
      end
    end

    context "with an activity outside competition dates" do
      before do
        room = competition.competition_venues.first.venue_rooms.first
        # The factory creates venues in "Europe/Paris" (UTC+1 in winter, UTC+2 in summer).
        # Picking 03:00 UTC means the local time is 04:00 (CET) or 05:00 (CEST) on end_date+1,
        # so the activity is always after midnight locally regardless of DST, and the warning fires.
        # 03:00 UTC also stays below noon UTC on end_date+1, which is the ceiling enforced by
        # ScheduleActivity#included_in_competition_dates (Competition#end_time uses UTC-12 = noon UTC),
        # so the record saves without bypassing that validation.
        next_day = competition.end_date + 1
        out_of_range_start = Time.utc(next_day.year, next_day.month, next_day.day, 3, 0, 0)
        room.schedule_activities.create!(
          wcif_id: 999,
          name: "Late closing ceremony",
          activity_code: "other-misc",
          start_time: out_of_range_start,
          end_time: out_of_range_start + 1.hour,
        )
      end

      it "warns about the out-of-range activity" do
        expected_warnings = [
          RV::ValidationWarning.new(
            SAV::ACTIVITY_OUTSIDE_COMPETITION_DATES_WARNING,
            :schedule,
            competition.id,
            activity_name: "Late closing ceremony",
            activity_code: "other-misc",
          ),
        ]

        validator_args.each do |arg|
          sav = SAV.new.validate(**arg)
          expect(sav.warnings).to match_array(expected_warnings)
          expect(sav.errors).to be_empty
        end
      end
    end

    context "with an activity that starts on end_date but ends past midnight in the venue's local timezone" do
      before do
        room = competition.competition_venues.first.venue_rooms.first
        # The factory creates venues in "Europe/Paris" (UTC+1 in winter, UTC+2 in summer).
        # Start at 20:00 UTC = 21:00 (CET) or 22:00 (CEST) on end_date — still on end_date locally.
        # End at 03:00 UTC on end_date+1 = 04:00 (CET) or 05:00 (CEST) — past midnight locally.
        # 03:00 UTC stays below noon UTC (Competition#end_time ceiling), so the record saves.
        end_date = competition.end_date
        next_day = end_date + 1
        room.schedule_activities.create!(
          wcif_id: 999,
          name: "Late closing ceremony",
          activity_code: "other-misc",
          start_time: Time.utc(end_date.year, end_date.month, end_date.day, 20, 0, 0),
          end_time: Time.utc(next_day.year, next_day.month, next_day.day, 3, 0, 0),
        )
      end

      it "warns about the out-of-range activity" do
        expected_warnings = [
          RV::ValidationWarning.new(
            SAV::ACTIVITY_OUTSIDE_COMPETITION_DATES_WARNING,
            :schedule,
            competition.id,
            activity_name: "Late closing ceremony",
            activity_code: "other-misc",
          ),
        ]

        validator_args.each do |arg|
          sav = SAV.new.validate(**arg)
          expect(sav.warnings).to match_array(expected_warnings)
          expect(sav.errors).to be_empty
        end
      end
    end
  end
end
