# frozen_string_literal: true

class TraineeDelegateApplication
  include ActiveModel::Model
  include ActiveModel::Attributes

  MINIMUM_APPLICANT_AGE = 17

  # Regional and Senior Delegates review the application, so they cannot also recommend the applicant.
  RECOMMENDING_DELEGATE_STATUSES = RolesMetadataDelegateRegions.statuses.values_at(:junior_delegate, :delegate).freeze

  # Translators, banned competitors and Delegates on probation don't hold a volunteer position.
  VOLUNTEER_GROUP_TYPES = UserGroup.group_types.values_at(
    :delegate_regions,
    :board,
    :officers,
    :teams_committees,
    :councils,
  ).freeze

  DECLARATIONS = %w[
    understands_application
    has_delegate_support
    proficient_in_english
    read_regulations
  ].freeze

  attr_accessor :applicant

  attribute :delegate_region_id, :integer
  attribute :spoken_to_delegate_user_ids, default: -> { [] }
  attribute :recommender_user_ids, default: -> { [] }
  attribute :declarations, default: -> { {} }
  attribute :introduction, :string
  attribute :competition_contributions, :string
  attribute :volunteer_history, :string
  attribute :motivation, :string
  attribute :relevant_skills, :string
  attribute :cubing_business_involvement, :boolean
  attribute :cubing_business_involvement_details, :string

  validates :introduction, :competition_contributions, :motivation, :relevant_skills, presence: true
  validate :validate_applicant_eligibility
  validate :validate_delegate_region
  validate :validate_spoken_to_delegates
  validate :validate_recommenders
  validate :validate_declarations
  validate :validate_cubing_business_involvement

  def eligible?
    eligibility_issues.empty?
  end

  def eligibility_issues
    [
      ("missing_wca_id" if applicant.wca_id.blank?),
      ("missing_date_of_birth" if applicant.dob.blank?),
      ("underage" if applicant.dob.present? && applicant_age < MINIMUM_APPLICANT_AGE),
    ].compact
  end

  def applicant_age
    return if applicant.dob.blank?

    today = Date.current
    years_since_birth_year = today.year - applicant.dob.year
    had_birthday_this_year = today >= applicant.dob + years_since_birth_year.years

    had_birthday_this_year ? years_since_birth_year : years_since_birth_year - 1
  end

  def competition_count
    # Applicants without a WCA ID have never competed.
    return 0 if applicant.person.blank?

    applicant.person.competitions.size
  end

  def self.leaf_regions
    UserGroup.delegate_regions.active_groups.includes(:direct_child_groups).filter do |region|
      region.direct_child_groups.none?(&:is_active)
    end
  end

  def self.root_region(region)
    region.parent_group ? root_region(region.parent_group) : region
  end

  def self.region_path_names(region)
    region.parent_group ? [*region_path_names(region.parent_group), region.name] : [region.name]
  end

  # The nearest Regional Delegate. The lead of a top-level region is its Senior Delegate, which is the fallback.
  def self.reviewer_for(region)
    region.lead_user || (region.parent_group && reviewer_for(region.parent_group))
  end

  def self.junior_and_full_delegate_roles(region)
    region.active_roles.includes(:user, :metadata).filter do |role|
      RECOMMENDING_DELEGATE_STATUSES.include?(role.metadata.status)
    end
  end

  def delegate_region
    @delegate_region ||= self.class.leaf_regions.find { it.id == delegate_region_id }
  end

  def delegate_region_name
    self.class.region_path_names(delegate_region).join(": ")
  end

  def reviewer
    self.class.reviewer_for(delegate_region)
  end

  delegate :senior_delegate, to: :delegate_region

  def junior_and_full_delegates
    return [] if delegate_region.blank?

    self.class.junior_and_full_delegate_roles(delegate_region).map(&:user).uniq
  end

  def spoken_to_delegates
    junior_and_full_delegates.filter { spoken_to_delegate_user_ids.include?(it.id) }
  end

  def recommenders
    junior_and_full_delegates.filter { recommender_user_ids.include?(it.id) }
  end

  def delegate_region_options
    self.class.leaf_regions.map do |region|
      root_region = self.class.root_region(region)

      {
        id: region.id,
        name: self.class.region_path_names(region).drop(1).join(": "),
        root_id: root_region.id,
        root_name: root_region.name,
        reviewer_name: self.class.reviewer_for(region)&.name,
        junior_and_full_delegates: self.class
                                       .junior_and_full_delegate_roles(region)
                                       .map { { id: it.user.id, name: it.user.name, status: it.metadata.status } }
                                       .uniq { it[:id] }
                                       .sort_by { it[:name] },
      }
    end.sort_by { [it[:root_name], it[:name]] }
  end

  def volunteer_role_history
    applicant.roles
             .joins(:group)
             .where(group: { group_type: VOLUNTEER_GROUP_TYPES })
             .preload(:group, :metadata)
             .order(start_date: :desc)
             .map do |role|
               {
                 id: role.id,
                 title: volunteer_role_title(role),
                 start_date: role.start_date,
                 end_date: role.end_date,
               }
             end
  end

  private def volunteer_role_title(role)
    # Board roles are the only volunteer roles without a status.
    status_name = if role.metadata.present?
                    I18n.t("enums.user_roles.status.#{role.group_type}.#{role.metadata.status}")
                  else
                    I18n.t("trainee_delegate_application.form.board_member")
                  end

    "#{status_name}, #{role.group.name}"
  end

  private def validate_applicant_eligibility
    eligibility_issues.each do |issue|
      errors.add(:base, I18n.t("trainee_delegate_application.eligibility.#{issue}", minimum_age: MINIMUM_APPLICANT_AGE))
    end
  end

  private def validate_delegate_region
    if delegate_region.blank?
      errors.add(:base, I18n.t("trainee_delegate_application.errors.invalid_region"))
    elsif reviewer.blank?
      errors.add(:base, I18n.t("trainee_delegate_application.errors.missing_reviewer"))
    end
  end

  private def validate_spoken_to_delegates
    if spoken_to_delegate_user_ids.empty?
      errors.add(:base, I18n.t("trainee_delegate_application.errors.spoken_delegate_required"))
    elsif (spoken_to_delegate_user_ids - junior_and_full_delegates.map(&:id)).any?
      errors.add(:base, I18n.t("trainee_delegate_application.errors.invalid_spoken_delegate"))
    end
  end

  private def validate_recommenders
    if recommender_user_ids.empty?
      errors.add(:base, I18n.t("trainee_delegate_application.errors.recommender_required"))
    elsif (recommender_user_ids - junior_and_full_delegates.map(&:id)).any?
      errors.add(:base, I18n.t("trainee_delegate_application.errors.invalid_recommender"))
    end
  end

  private def validate_declarations
    return if declarations.values_at(*DECLARATIONS).all?(true)

    errors.add(:base, I18n.t("trainee_delegate_application.errors.declarations_required"))
  end

  private def validate_cubing_business_involvement
    if cubing_business_involvement.nil?
      errors.add(:base, I18n.t("trainee_delegate_application.errors.business_involvement_required"))
    elsif cubing_business_involvement && cubing_business_involvement_details.blank?
      errors.add(:base, I18n.t("trainee_delegate_application.errors.business_involvement_explanation_required"))
    end
  end
end
