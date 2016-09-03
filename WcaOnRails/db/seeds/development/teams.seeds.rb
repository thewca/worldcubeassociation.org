# frozen_string_literal: true
board = Committee.find_by_slug('wca-board')
delegates = Committee.find_by_slug('wca-delegates-committee')
regulations = Committee.find_by_slug('wca-regulations-committee')
disciplinary = Committee.find_by_slug('wca-disciplinary-committee')
results = Committee.find_by_slug('wca-results-committee')
software = Committee.find_by_slug('wca-software-committee')

board.teams.create(name: 'Board Members', \
                   slug: 'board-members', \
                   description: 'This team lists the members of the WCA Board.')
delegates.teams.create(name: 'World Delegates', \
                       slug: 'world-delegates', \
                       description: 'This team is responsible for delegating competitions anywhere in the World.')
results.teams.create(name: 'Results Team', \
                     slug: 'results-team', \
                     description: 'This team is responsible for managing all competition results and personn data.')
regulations.teams.create(name: 'Regulations Team', \
                         slug: 'regulations-team', \
                         description: 'This team is responsible for managing all WCA regulations.')
disciplinary.teams.create(name: 'Disciplinary Team', \
                          slug: 'disciplinary-team', \
                          description: 'This team is responsible for all disciplinary matters of the WCA.')
software.teams.create(name: 'Software Team', \
                      slug: 'software-team', \
                      description: 'This team is responsible for all WCA software.')
