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
    level = [Competition::ANNOUNCED_DAYS_WARNING, Competition::ANNOUNCED_DAYS_DANGER].select {|d| days_announced > d}.count
    ["alert-danger", "alert-orange", "alert-green"][level]
  end

  def report_and_results_class(days)
    level = [Competition::REPORT_AND_RESULTS_DAYS_OK, Competition::REPORT_AND_RESULTS_DAYS_WARNING, Competition::REPORT_AND_RESULTS_DAYS_DANGER].select {|d| days > d}.count
    ["alert-green", "alert-success", "alert-orange", "alert-danger"][level]
  end
end
