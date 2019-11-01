# frozen_string_literal: true

class DelegateReport < ApplicationRecord
  REPORTS_ENABLED_DATE = Date.new(2016, 6, 1)

  belongs_to :competition
  belongs_to :posted_by_user, class_name: "User"
  belongs_to :wrc_primary_user, class_name: "User"
  belongs_to :wrc_secondary_user, class_name: "User"

  attr_accessor :current_user

  before_create :set_discussion_url
  def set_discussion_url
    self.discussion_url = "https://groups.google.com/a/worldcubeassociation.org/forum/#!topicsearchin/reports/" + URI.encode_www_form_component(competition.name)
  end

  before_create :equipment_default
  def equipment_default
    self.equipment = "Gen 2 Timer: 0
Gen 3 Pro Timer: 0
Gen 4 Pro Timer: 0

Gen 2 Display: 0
Gen 3 Display: 0"
  end

  before_create :venue_default
  def venue_default
    self.venue = "* **Previous Competitions in the same venue?:**

* **Type:** [conference room, school classroom, organiser’s living room, backyard, other]

* **Space/Size:** [Rough estimates about size. Was it too full/empty? What is the maximum capacity in your opinion?]

* **Light:** [Rate the lighting. Have there been problems/complaints?]

* **Temperature:** [Rate the temperature. Did it change throughout the competition day(s)?]

* **Accessibility:** [How can you reach the venue by public transport / by car? Were there accomodation spots nearby?]

* **Setup:** [Use of graphics / photos is highly encouraged!]"
  end

  before_create :organization_default
  def organization_default
    # rubocop:disable Metrics/LineLength
    self.organization = "* **Organization team:** [Who are the persons in the organisation team? Was this their first organised competition or do they have previous experience? How did they do their job with the tasks before the competition? How did they do during the competition? Are you likely going to work with the organiser(s) again?]

* **Delegates:** [If you are not the closest living Delegate: Why are you in charge of this competition? Were there other listed Delegates besides you? Were there other unlisted Delegates present? Did you coordinate everything well with the organisers before and during the weekend? Did you carry out any of the organisation tasks?]

* **Schedule:** [Did you fall behind or run ahead of schedule? What were the reasons for deviations? Did you start/end the competition day(s) on time?]

* **Judging system:** [Running VS Fixed/Seated? Did you have dedicated staff? Were there pre-computed assignments (i.e. Groupifier)?]

* **Scrambling:** [How many scramblers did you generally assign? Did you have troubles with the scrambling of any particular puzzles? Did you use scrambler signatures? Did you use printed scrambles or display device(s)? If printed, who prepared the print-outs? If display, who was in charge of changing scrambles with password access?]

* **Score-taking:** [Did you catch up with score-taking or were there significant delays between the event happening and the times being entered? When did you perform score checks?]

* **Software:** [Which programs did you use to help you with managing the competition? What software was used to create the Scorecards? If custom, is the source code freely available? If custom, why did you decide to use the program instead of WCA-recommended alternatives?]

* **Budget:** [What were the (major) expenses like, most notably venue cost? Did you manage to generate enough revenue to cover all expenses? Did you have any excess at the end? Where did that go/What are you planning on spending it on? Did you get any support from local cubing organizations?]

* **Prizes:** [Did you give out any form of certificates or prizes to the winners? If so, what?]

* **Delegate expenses:** [Which costs were paid for the listed Delegate(s)? Who were they paid by and where did the money come from?]

* **Sponsors:** [Were there any companies sponsoring the competition? If so, what form of sponsorship did you get (money, cubes, other)? What did you have to do in return?]

* **Media coverage:** [Was there some form of media coverage (TV show, newspaper)?]"
    # rubocop:enable Metrics/LineLength
  end

  before_create :incidents_default
  def incidents_default
    self.incidents = "1.
2.
3."
  end

  validates :schedule_url, presence: true, if: :schedule_and_disussion_urls_required?
  validates :schedule_url, url: true
  validates :discussion_url, presence: true, if: :schedule_and_disussion_urls_required?
  validates :discussion_url, url: true
  validates :wrc_incidents, presence: true, if: :wrc_feedback_requested
  validates :wdc_incidents, presence: true, if: :wdc_feedback_requested

  def schedule_and_disussion_urls_required?
    posted? && created_at > Date.new(2019, 7, 21)
  end

  def posted?
    !!posted_at
  end

  def posted=(new_posted)
    new_posted = ActiveRecord::Type::Boolean.new.cast(new_posted)
    self.posted_at = (new_posted ? Time.now : nil)
    self.posted_by_user_id = current_user&.id
  end
end
