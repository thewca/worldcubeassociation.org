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
end
