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
    if days_announced <= 21
      "alert-danger"
    elsif days_announced <= 28
      "alert-orange"
    else
      "alert-green"
    end
  end

  def report_class(days_report)
    if days_report > 21
      "alert-danger"
    elsif days_report > 14
      "alert-orange"
    elsif days_report > 7
      "alert-success"
    else
      "alert-green"
    end
  end

  def results_class(days_results)
    if days_results > 21
      "alert-danger"
    elsif days_results > 14
      "alert-orange"
    elsif days_results > 7
      "alert-success"
    else
      "alert-green"
    end
  end
end
