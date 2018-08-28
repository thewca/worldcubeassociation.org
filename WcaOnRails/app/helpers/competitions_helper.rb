# frozen_string_literal: true

module CompetitionsHelper
  def competition_message_for_user(competition, user)
    messages = []
    registration = competition.registrations.find_by_user_id(user.id)
    if registration
      messages << (registration.accepted? ? t('competitions.messages.tooltip_registered') : t('competitions.messages.tooltip_waiting_list'))
    end
    visible = competition.showAtAll?
    messages << if competition.isConfirmed?
                  visible ? t('competitions.messages.confirmed_visible') : t('competitions.messages.confirmed_not_visible')
                else
                  visible ? t('competitions.messages.not_confirmed_visible') : t('competitions.messages.not_confirmed_not_visible')
                end
    messages.join(' ')
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
    days_results = days_after_competition(competition.results_posted_at, competition)
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
                  last_activity.end_time.in_time_zone(timezone).strftime("%H:59:00")
                else
                  "20:00:00"
                end
    [first_time, last_time]
  end
end
