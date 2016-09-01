# frozen_string_literal: true
board_duties = <<EOS
Responsible for the governance of the WCA.
EOS
Committee.create(name: 'WCA Board', \
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
Committee.create(name: 'WCA Delgates Committee', \
                 slug: Committee::WCA_DELEGATES_COMMITTEE, \
                 duties: delegate_duties, \
                 email: 'delegates@worldcubeassociation.org')

disciplinary_duties = <<EOS
This committee advises the WCA Board in special cases, like alleged violations
of WCA Regulations, and may be contacted by WCA members in case of important
personal matters regarding WCA competitions
EOS
Committee.create(name: 'WCA Disciplinary Committee', \
                 slug: Committee::WCA_DISCIPLINARY_COMMITTEE, \
                 duties: disciplinary_duties, \
                 email: 'wdc@worldcubeassociation.org')

regulation_duties = <<EOS
This committee is responsible for managing the WCA Regulations.
EOS
Committee.create(name: 'WCA Regulations Committee', \
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
Committee.create(name: 'WCA Software Committee', \
                 slug: Committee::WCA_SOFTWARE_COMMITTEE, \
                 duties: software_duties, \
                 email: 'software@worldcubeassociation.org')
