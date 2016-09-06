# frozen_string_literal: true
Team.create(friendly_id: 'results', name: 'Results Team',
            description: 'This team is responsible for managing all competition results.')
Team.create(friendly_id: 'software', name: 'Software Team',
            description: "This team is responsible for managing the WCA's software (website, scramblers, workbooks, admin tools).")
Team.create(friendly_id: 'wdc', name: 'Disciplinary Committee',
            description: 'This committee advises the WCA Board in special cases, like alleged violations of WCA Regulations, and may be contacted by WCA members in case of important personal matters regarding WCA competitions.')
Team.create(friendly_id: 'wrc', name: 'Regulations Committee',
            description: 'This committee is responsible for managing the WCA Regulations.')
