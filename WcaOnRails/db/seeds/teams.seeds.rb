# frozen_string_literal: true

Team.create(friendly_id: 'board', rank: 1, email: "board@worldcubeassociation.org")
Team.create(friendly_id: 'wct', rank: 10, email: "communication@worldcubeassociation.org")
Team.create(friendly_id: 'wdc', rank: 20, email: "disciplinary@worldcubeassociation.org")
Team.create(friendly_id: 'wec', rank: 30, email: "ethics@worldcubeassociation.org")
Team.create(friendly_id: 'wfc', rank: 40, email: "finance@worldcubeassociation.org")
Team.create(friendly_id: 'wmt', rank: 50, email: "marketing@worldcubeassociation.org")
Team.create(friendly_id: 'wqac', rank: 60, email: "quality@worldcubeassociation.org")
Team.create(friendly_id: 'wrc', rank: 70, email: "regulations@worldcubeassociation.org")
Team.create(friendly_id: 'wrt', rank: 80, email: "results@worldcubeassociation.org")
Team.create(friendly_id: 'wst', rank: 90, email: "software@worldcubeassociation.org")
Team.create(friendly_id: 'banned', rank: 100, email: "disciplinary@worldcubeassociation.org", hidden: true)
