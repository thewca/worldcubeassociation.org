class UsersController < ApplicationController
  # For now, only allow admins to view this, as we're showing email addresses here
  before_action :authenticate_user!
  before_action :can_edit_users_only

  def self.WCA_ROLES
    [:admin, :results_team]
  end

  def index
    @users = User.order(name: :asc, email: :asc).paginate(page: params[:page])
  end

  def edit
    @user = User.find(params[:id])
    @from_page = params[:from_page]
  end

  def update
    @user = User.find(params[:id])
    new_admin = ActiveRecord::Type::Boolean.new.type_cast_from_user(user_params[:admin])
    new_board_member = user_params[:delegate_status] == "board_member"
    if @user == current_user && @user.admin? && !new_admin && !new_board_member
      flash[:danger] = "You cannot resign from your role as an admin! Find another admin to fire you."
      render :edit
    elsif @user == current_user && @user.board_member? && !new_admin && !new_board_member
      flash[:danger] = "You cannot resign from your role as a board member! Find another board member to fire you."
      render :edit
    elsif @user.update_attributes(user_params)
      flash[:success] = "User updated"
      redirect_to edit_user_url @user, from_page: params[:from_page]
    else
      flash[:danger] = "Error updating user"
      render :edit
    end
  end

  private def user_params
    user_params = params.require(:user).permit(*current_user.editable_other_user_fields)
    if user_params.has_key?(user_params[:delegate_status]) && !User.delegate_status_requires_senior_delegate(user_params[:delegate_status])
      user_params["senior_delegate_id"] = nil
    end
    user_params
  end

  private def can_edit_users_only
    unless current_user && current_user.can_edit_users?
      flash[:danger] = "You cannot edit users"
      redirect_to root_url
    end
  end
end
