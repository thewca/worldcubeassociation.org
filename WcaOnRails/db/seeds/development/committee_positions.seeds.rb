after :committees do
  board = Committee.find_by_slug('wca-board')
  delegates = Committee.find_by_slug('wca-delegates-committee')
  regulations = Committee.find_by_slug('wca-regulations-committee')
  disciplinary = Committee.find_by_slug('wca-disciplinary-committee')
  results = Committee.find_by_slug('wca-results-committee')
  software = Committee.find_by_slug('wca-software-committee')

  board.committee_positions.create(name: 'Board Member', \
                                   slug: 'board-member', \
                                   description: 'Board members are responsible for governing the WCA.', \
                                   team_leader: true)
  delegates.committee_positions.create(name: 'Candidate Delegate', \
                                       slug: 'candidate-delegate', \
                                       description: 'Candidate delegate', \
                                       team_leader: false)
  delegates.committee_positions.create(name: 'Delegate', \
                                       slug: 'delegate', \
                                       description: 'Delegate', \
                                       team_leader: false)
  delegates.committee_positions.create(name: 'Senior Delegate', \
                                       slug: 'senior-delegate', \
                                       description: 'Senior Delegate', \
                                       team_leader: true)
  regulations.committee_positions.create(name: 'Team Leader', \
                                         slug: 'team-leader', \
                                         description: 'Team Leader', \
                                         team_leader: true)
  disciplinary.committee_positions.create(name: 'Team Leader', \
                                          slug: 'team-leader', \
                                          description: 'Team Leader', \
                                          team_leader: true)
  results.committee_positions.create(name: 'Team Leader', \
                                     slug: 'team-leader', \
                                     description: 'Team Leader', \
                                     team_leader: true)
  software.committee_positions.create(name: 'Team Leader', \
                                      slug: 'team-leader', \
                                      description: 'Team Leader', \
                                      team_leader: true)
  regulations.committee_positions.create(name: 'Team Member', \
                                         slug: 'team-member', \
                                         description: 'Team Member', \
                                         team_leader: false)
  disciplinary.committee_positions.create(name: 'Team Member', \
                                          slug: 'team-member', \
                                          description: 'Team Member', \
                                          team_leader: false)
  results.committee_positions.create(name: 'Team Member', \
                                     slug: 'team-member', \
                                     description: 'Team Member', \
                                     team_leader: false)
  software.committee_positions.create(name: 'Team Member', \
                                      slug: 'team-member', \
                                      description: 'Team Member', \
                                      team_leader: false)
end
