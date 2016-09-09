# frozen_string_literal: true
module CompetitionsHelper
  def competition_message_for_user(competition, user)
    messages = []
    registration = competition.registrations.find_by_user_id(user.id)
    if registration
      # i18n-tasks-use t('competitions.registered')
      # i18n-tasks-use t('competitions.waiting_list')
      messages << t('competitions.registration_tooltip', message: registration.accepted? ? t('competitions.registered') : t('competitions.waiting_list'))
    end
    visible = competition.showAtAll?
    messages << if competition.isConfirmed?
                  # i18n-tasks-use t('and')
                  # i18n-tasks-use t('but not')
                  t('competitions.confirmed', link_word: visible ? t('and') : t('but not'))
                else
                  # i18n-tasks-use t('and not')
                  # i18n-tasks-use t('but')
                  t('competitions.not_confirmed', link_word: visible ? t('but') : t('and not'))
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
