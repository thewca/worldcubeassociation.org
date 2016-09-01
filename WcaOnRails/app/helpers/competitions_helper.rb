# frozen_string_literal: true
module CompetitionsHelper
  def competition_message_for_user(competition, user)
    messages = []
    registration = competition.registrations.find_by_user_id(user.id)
    if registration
      messages << "You are " + (registration.accepted? ? "registered." : "currently on the waiting list.")
    end
    visible = competition.showAtAll?
    messages << if competition.isConfirmed?
                  "This competition is confirmed #{visible ? 'and' : 'but not'} visible."
                else
                  "This competition is not confirmed #{visible ? 'but' : 'and not'} visible."
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
