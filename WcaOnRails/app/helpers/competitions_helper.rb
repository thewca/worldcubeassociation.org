# frozen_string_literal: true

module CompetitionsHelper
  def competition_message_for_user(competition, user)
    messages = []
    registration = competition.registrations.find_by_user_id(user.id)
    if registration
      messages << (registration.accepted? ? t('competitions.messages.tooltip_registered') : t('competitions.messages.tooltip_waiting_list'))
    end
    visible = competition.showAtAll?
    messages << if competition.confirmed?
                  visible ? t('competitions.messages.confirmed_visible') : t('competitions.messages.confirmed_not_visible')
                else
                  visible ? t('competitions.messages.not_confirmed_visible') : t('competitions.messages.not_confirmed_not_visible')
                end
    messages.join(' ')
  end

  def pretty_print_result(result, short: false)
    event = result.event
    sort_by = result.format.sort_by

    # If the format for this round was to sort by average, but this particular
    # result did not achieve an average, then switch to "best", and do not allow
    # a short format (to make it clear what happened).
    if sort_by == "average" && result.to_solve_time(:average).incomplete?
      sort_by = "single"
      short = false
    end

    solve_time = nil
    a_win_by_word = nil
    case sort_by
    when "single"
      solve_time = result.to_solve_time(:best)
      a_win_by_word = if event.multiple_blindfolded?
                        t('competitions.competition_info.result')
                      else
                        t('competitions.competition_info.single')
                      end
    when "average"
      solve_time = result.to_solve_time(:average)
      a_win_by_word = result.format.id == "a" ? t('competitions.competition_info.average') : t('competitions.competition_info.mean')
    end

    if short
      solve_time.clock_format
    else
      t('competitions.competition_info.result_sentence', a_win_by_word: a_win_by_word, result: solve_time.clock_format_with_units)
    end
  end

  def people_to_sentence(results)
    results
      .sort_by(&:personName)
      .map { |result| "[#{result.personName}](#{person_url result.personId})" }
      .to_sentence
  end

  def winners(competition, main_event)
    top_three = competition.results.where(event: main_event).podium.order(:pos)
    results_by_place = top_three.group_by(&:pos)
    winners = results_by_place[1]

    text = t('competitions.competition_info.winner', winner: people_to_sentence(winners),
                                                     result_sentence: pretty_print_result(winners.first),
                                                     event_name: main_event.name)
    if results_by_place[2]
      text += t('competitions.competition_info.first_runner_up', first_runner_up: people_to_sentence(results_by_place[2]),
                                                                 first_runner_up_result: pretty_print_result(top_three.second, short: true))
      if results_by_place[3]
        text += t('competitions.competition_info.and')
        text += t('competitions.competition_info.second_runner_up', second_runner_up: people_to_sentence(results_by_place[3]),
                                                                    second_runner_up_result: pretty_print_result(top_three.third, short: true))
      else
        text += "."
      end
    elsif results_by_place[3]
      text += t('competitions.competition_info.second_runner_up', second_runner_up: people_to_sentence(results_by_place[3]),
                                                                  second_runner_up_result: pretty_print_result(top_three.third, short: true))
    end

    text
  end

  def records(competition)
    text = ""
    codes = ["WR", "AfR", "AsR", "OcR", "ER", "NAR", "SAR"]
    codes.each do |code|
      comp_records = competition.results.where('regionalSingleRecord=:code OR regionalAverageRecord=:code', code: code)
      unless comp_records.empty?
        text += t("competitions.competition_info.records.#{code.downcase}")
        text += ": "
        record_strs = comp_records.group_by(&:personName).sort.map do |personName, results_for_name|
          results_by_personId = results_for_name.group_by(&:personId).sort
          results_by_personId.map do |personId, results|
            if results_by_personId.length > 1
              # Two or more people with the same name set records at this competition!
              # Append their WCA IDs to distinguish between them.
              uniqueName = "[#{personName} (#{personId})](#{person_url personId})"
            else
              uniqueName = "[#{personName}](#{person_url personId})"
            end
            record_strs = results.sort_by do |r|
              round_type = RoundType.c_find(r.roundTypeId)
              [Event.c_find(r.eventId).rank, round_type.rank]
            end.map do |result|
              event = Event.c_find(result.eventId)
              record_strs = []
              if result.regionalSingleRecord == code
                record_strs << t('competitions.competition_info.regional_single_record', event_name: event.name, result: (result.to_s :best))
              end
              if result.regionalAverageRecord == code
                record_strs << t('competitions.competition_info.regional_average_record', event_name: event.name, result: (result.to_s :average))
              end
              record_strs
            end.flatten
            "#{uniqueName}&lrm; #{record_strs.to_sentence}"
          end
        end
        text += "#{record_strs.join("; ")}.  \n" # Trailing spaces for markdown give us a <br>
      end
    end

    text
  end

  private def days_before_competition(date, competition)
    date ? (competition.start_date - date.to_date).to_i : nil
  end

  private def days_after_competition(date, competition)
    date ? (date.to_date - competition.end_date).to_i : nil
  end

  private def days_announced_before_competition(competition)
    days_before_competition(competition.announced_at, competition)
  end

  def announced_content(competition)
    competition.announced_at ? "#{pluralize(days_announced_before_competition(competition), "day")} before" : ""
  end

  def announced_class(competition)
    if competition.announced_at
      level = [Competition::ANNOUNCED_DAYS_WARNING, Competition::ANNOUNCED_DAYS_DANGER].select { |d| days_announced_before_competition(competition) > d }.count
      ["alert-danger", "alert-orange", "alert-green"][level]
    else
      ""
    end
  end

  private def report_and_results_days_to_class(days)
    level = [Competition::REPORT_AND_RESULTS_DAYS_OK, Competition::REPORT_AND_RESULTS_DAYS_WARNING, Competition::REPORT_AND_RESULTS_DAYS_DANGER].select { |d| days > d }.count
    ["alert-green", "alert-success", "alert-orange", "alert-danger"][level]
  end

  def report_content(competition)
    days_report = days_after_competition(competition.delegate_report.posted_at, competition)
    if days_report
      submitted_by_competition_delegate = competition.delegates.include?(competition.delegate_report.posted_by_user)
      submitted_by_competition_delegate ? "#{pluralize(days_report, "day")} after" : "submitted by other"
    else
      competition.is_probably_over? ? "pending" : ""
    end
  end

  def report_class(competition)
    days_report = days_after_competition(competition.delegate_report.posted_at, competition)
    if days_report
      report_and_results_days_to_class(days_report)
    elsif competition.is_probably_over?
      days_report = days_after_competition(Date.today, competition)
      report_and_results_days_to_class(days_report)
    else
      ""
    end
  end

  def results_content(competition)
    days_results = days_after_competition(competition.results_submitted_at, competition)
    if days_results
      "#{pluralize(days_results, "day")} after"
    else
      competition.is_probably_over? ? "pending" : ""
    end
  end

  def results_class(competition)
    return "" unless competition.is_probably_over?

    days_results = days_after_competition(competition.results_posted_at, competition)
    days_results ? report_and_results_days_to_class(days_results) : ""
  end

  def year_is_a_number?(year)
    year.is_a?(Integer) || year =~ /\A\d+\z/
  end

  def competitions_json_for_markers(competitions)
    competitions.map do |c|
      {
        id: c.id,
        name: c.name,
        latitude_degrees: c.latitude_degrees,
        longitude_degrees: c.longitude_degrees,
        cityName: c.cityName,
        marker_date: wca_date_range(c.start_date, c.end_date),
        is_probably_over: c.is_probably_over?,
        url: competition_path(c),
      }
    end.to_json.html_safe
  end

  def championship_option_tags(selected: nil)
    grouped_championship_types = {
      "Planetary Championship" => [["World", "world"]],
      "Continental Championship" => Continent.all_sorted_by(I18n.locale, real: true).map { |continent| [continent.name, continent.id] },
      "Multi-country Championship" => EligibleCountryIso2ForChampionship.championship_types.map { |championship_type| [championship_type.titleize, championship_type] },
      "National Championship" => Country.all_sorted_by(I18n.locale, real: true).map { |country| [country.name, country.iso2] },
    }
    grouped_options_for_select(grouped_championship_types, selected)
  end

  def first_and_last_time_from_activities(activities, timezone)
    # The goal of this function is to determine what should be the starting and ending points in the time axis of the calendar.
    # Which means we need to find the earliest start_time (and latest end_time) for any activity occuring on all days, expressed in the local timezone.
    # To do that we first convert the start_time to the local timezone, and keep only the "time of the day" component of the datetime.
    # We can sort the activities based on this value to compute the extremum of the time axis.
    sorted_activities = activities.sort_by { |a| a.start_time.in_time_zone(timezone).strftime("%H:%M") }
    first_activity = sorted_activities.first
    first_time = if first_activity
                   first_activity.start_time.in_time_zone(timezone).strftime("%H:00:00")
                 else
                   "08:00:00"
                 end
    last_activity = sorted_activities.last
    last_time = if last_activity
                  last_timestamp = last_activity.end_time.in_time_zone(timezone)
                  if last_timestamp.hour == 0 && last_timestamp.min == 0
                    "23:59:59"
                  else
                    last_timestamp.strftime("%H:59:59")
                  end
                else
                  "20:00:00"
                end
    [first_time, last_time]
  end

  def create_pdfs_directory
    FileUtils.mkdir_p(CleanupPdfs::CACHE_DIRECTORY) unless File.directory?(CleanupPdfs::CACHE_DIRECTORY)
  end

  def path_to_cached_pdf(competition, colors)
    CleanupPdfs::CACHE_DIRECTORY.join("#{cached_pdf_name(competition, colors)}.pdf")
  end

  def pdf_name(competition)
    "#{competition.id}_#{I18n.locale}"
  end

  def cached_pdf_name(competition, colors)
    "#{pdf_name(competition)}_#{competition.updated_at.iso8601}_#{colors}"
  end
end
