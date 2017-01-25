# frozen_string_literal: true
# Code originally from the time_will_tell gem: https://github.com/mbillard/time_will_tell/blob/9ec1300fe9672c11307d70198d92c8ad820b3876/lib/time_will_tell/helpers/date_range_helper.rb
# Copyright (c) 2014 Michel Billard
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining
# a copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:
#
# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.
module WcaDateHelpers
  def self.date_range(from_date, to_date, options={})
    format    = options.fetch(:format, :short)
    scope     = options.fetch(:scope, 'time_will_tell.date_range')
    separator = options.fetch(:separator, '-')
    show_year = options.fetch(:show_year, true)
    locale    = options.fetch(:locale, I18n.locale)

    month_names = format.to_sym == :short ? I18n.t("date.abbr_month_names", locale: locale) : I18n.t("date.month_names", locale: locale)

    from_date, to_date = to_date, from_date if from_date > to_date
    from_day   = from_date.day
    from_month = month_names[from_date.month]
    from_year  = from_date.year
    to_day     = to_date.day

    dates = { from_day: from_day, sep: separator }

    if from_date == to_date
      # i18n-tasks-use t('time_will_tell.date_range.same_date')
      template = :same_date
      dates[:month] = from_month
      dates[:year] = from_year
    elsif from_date.month == to_date.month && from_date.year == to_date.year
      # i18n-tasks-use t('time_will_tell.date_range.same_month')
      template = :same_month
      dates.merge!(to_day: to_day, month: from_month, year: from_year)
    else
      to_month = month_names[to_date.month]

      dates.merge!(from_month: from_month, to_month: to_month, to_day: to_day)

      if from_date.year == to_date.year
        # i18n-tasks-use t('time_will_tell.date_range.different_months_same_year')
        template = :different_months_same_year
        dates[:year] = from_year
      else
        to_year = to_date.year

        # i18n-tasks-use t('time_will_tell.date_range.different_years')
        template = :different_years
        dates[:from_year] = from_year
        dates[:to_year] = to_year
      end
    end

    without_year = I18n.t("#{scope}.#{template}", dates.merge(locale: locale))

    if show_year && from_date.year == to_date.year
      # i18n-tasks-use t('time_will_tell.date_range.with_year')
      I18n.t("#{scope}.with_year", date_range: without_year, year: from_year, default: without_year, locale: locale)
    else
      without_year
    end
  end
end
