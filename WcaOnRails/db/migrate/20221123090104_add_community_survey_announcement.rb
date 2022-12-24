# frozen_string_literal: true

class AddCommunitySurveyAnnouncement < ActiveRecord::Migration[7.0]
  def change
    # Notification dates and contents are approved by WAC

    # December 1st, 2022
    survey_launch = Date.strptime('06-12-2022', '%d-%m-%Y')
    # Ekaterina: t will be open until 2359 2023-01-15 UTC
    survey_end = Date.strptime('16-01-2023', '%d-%m-%Y')

    Starburst::Announcement.create(
      body: 'The WCA is conducting the <b>WCA Community Survey 2022</b>, take this chance to provide your feedback! ' \
            '<b>Before starting the survey, see <a href="https://www.worldcubeassociation.org/posts/wca-community-survey-2022">this</a> announcement for more details</b>. ' \
            'Click <a href="https://worldcubeassociation.org/redirect/wac-survey">here</a> to take the Survey.',
      start_delivering_at: survey_launch,
      stop_delivering_at: survey_end,
    )
  end
end
