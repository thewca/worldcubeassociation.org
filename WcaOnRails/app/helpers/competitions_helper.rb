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

  def announced_class(days_announced)
    level = [21, 28].select {|d| days_announced > d}.count
    ["alert-danger", "alert-orange", "alert-green"][level]
  end

  def report_class(days_report)
    level = [7, 14, 21].select {|d| days_report > d}.count
    ["alert-green", "alert-success", "alert-orange", "alert-danger"][level]
  end

  def results_class(days_results)
    level = [7, 14, 21].select {|d| days_results > d}.count
    ["alert-green", "alert-success", "alert-orange", "alert-danger"][level]
  end
end
