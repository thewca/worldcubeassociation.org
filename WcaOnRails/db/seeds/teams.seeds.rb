# frozen_string_literal: true
board_duties = <<EOS
Responsible for the governance of the WCA.
EOS
@board = Committee.create(name: 'WCA Board', \
                          slug: Committee::WCA_BOARD, \
                          duties: board_duties,
                          email: 'board@worldcubeassociation.org')

delegate_duties = <<EOS
**WCA Delegates** are members of the WCA who are responsible for making sure
that all WCA competitions are run according to the mission, regulations
and spirit of the WCA. The WCA distinguishes between **WCA Senior Delegates,
WCA Delegates and WCA Candidate Delegates.** Additional to the duties of a
WCA Delegate, a WCA Senior Delegate is responsible for managing the Delegates
in their area and can also be contacted by the community for regional matters.
New Delegates are at first listed as WCA Candidate Delegates and need to show
that they are capable of managing competitions successfully before being
listed as WCA Delegates.
EOS
@delegates = Committee.create(name: 'WCA Delgates Committee', \
                              slug: Committee::WCA_DELEGATES_COMMITTEE, \
                              duties: delegate_duties, \
                              email: 'delegates@worldcubeassociation.org')

disciplinary_duties = <<EOS
This committee advises the WCA Board in special cases, like alleged violations
of WCA Regulations, and may be contacted by WCA members in case of important
personal matters regarding WCA competitions
EOS
@disciplinary = Committee.create(name: 'WCA Disciplinary Committee', \
                                 slug: Committee::WCA_DISCIPLINARY_COMMITTEE, \
                                 duties: disciplinary_duties, \
                                 email: 'wdc@worldcubeassociation.org')

regulation_duties = <<EOS
This committee is responsible for managing the WCA Regulations.
EOS
@regulations = Committee.create(name: 'WCA Regulations Committee', \
                                slug: Committee::WCA_REGULATIONS_COMMITTEE, \
                                duties: regulation_duties, \
                                email: 'wrc@worldcubeassociation.org')

results_duties = <<EOS
This committee is responsible for managing all WCA competition results.
EOS
@results = Committee.create(name: 'WCA Results Committee', \
                            slug: Committee::WCA_RESULTS_COMMITTEE, \
                            duties: results_duties, \
                            email: 'results@worldcubeassociation.org')

software_duties = <<EOS
This committee is responsible for managing the WCA's software (website, scramblers, workbooks, admin tools).
EOS
@software = Committee.create(name: 'WCA Software Committee', \
                             slug: Committee::WCA_SOFTWARE_COMMITTEE, \
                             duties: software_duties, \
                             email: 'software@worldcubeassociation.org')

CommitteePosition.create(name: 'Board Member', \
                         slug: 'board-member', \
                         description: 'Board members are responsible for governing the WCA.', \
                         team_leader: true, \
                         committee_id: @board.id)
CommitteePosition.create(name: 'Candidate Delegate', \
                         slug: 'candidate-delegate', \
                         description: 'Candidate delegate', \
                         team_leader: false, \
                         committee_id: @delegates.id)
CommitteePosition.create(name: 'Delegate', \
                         slug: 'delegate', \
                         description: 'Delegate', \
                         team_leader: false, \
                         committee_id: @delegates.id)
CommitteePosition.create(name: 'Senior Delegate', \
                         slug: 'senior-delegate', \
                         description: 'Senior Delegate', \
                         team_leader: true, \
                         committee_id: @delegates.id)
CommitteePosition.create(name: 'Team Leader', \
                         slug: 'team-leader', \
                         description: 'Team Leader', \
                         team_leader: true, \
                         committee_id: @regulations.id)
CommitteePosition.create(name: 'Team Leader', \
                         slug: 'team-leader', \
                         description: 'Team Leader', \
                         team_leader: true, \
                         committee_id: @disciplinary.id)
CommitteePosition.create(name: 'Team Leader', \
                         slug: 'team-leader', \
                         description: 'Team Leader', \
                         team_leader: true, \
                         committee_id: @results.id)
CommitteePosition.create(name: 'Team Leader', \
                         slug: 'team-leader', \
                         description: 'Team Leader', \
                         team_leader: true, \
                         committee_id: @software.id)
CommitteePosition.create(name: 'Team Member', \
                         slug: 'team-member', \
                         description: 'Team Member', \
                         team_leader: false, \
                         committee_id: @regulations.id)
CommitteePosition.create(name: 'Team Member', \
                         slug: 'team-member', \
                         description: 'Team Member', \
                         team_leader: false, \
                         committee_id: @disciplinary.id)
CommitteePosition.create(name: 'Team Member', \
                         slug: 'team-member', \
                         description: 'Team Member', \
                         team_leader: false, \
                         committee_id: @results.id)
CommitteePosition.create(name: 'Team Member', \
                         slug: 'team-member', \
                         description: 'Team Member', \
                         team_leader: false, \
                         committee_id: @software.id)

Team.create(name: 'Board Members', \
            slug: 'board-members', \
            description: 'This team lists the members of the WCA Board.', \
            committee_id: @board.id)
Team.create(name: 'Results Team', \
            slug: 'results-team', \
            description: 'This team is responsible for managing all competition results and personn data.', \
            committee_id: @results.id)
Team.create(name: 'Regulations Team', \
            slug: 'regulations-team', \
            description: 'This team is responsible for managing all WCA regulations.', \
            committee_id: @regulations.id)
Team.create(name: 'Disciplinary Team', \
            slug: 'disciplinary-team', \
            description: 'This team is responsible for all disciplinary matters of the WCA.', \
            committee_id: @disciplinary.id)
Team.create(name: 'Software Team', \
            slug: 'software-team', \
            description: 'This team is responsible for all WCA software.', \
            committee_id: @software.id)
