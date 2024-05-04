# frozen_string_literal: true

Team.create(friendly_id: 'wrc', email: "regulations@worldcubeassociation.org")
Team.create(friendly_id: 'wst', email: "software@worldcubeassociation.org")
Team.create(friendly_id: 'banned', email: "disciplinary@worldcubeassociation.org", hidden: true)
Team.create(friendly_id: 'wdpc', hidden: true)
