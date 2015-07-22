class UsersController < ApplicationController
  before_action :authenticate_user!, except: [:search]

  def self.WCA_ROLES
    [:admin, :results_team]
  end

  def index
    can_edit_users_only
    @users_grid = initialize_grid(User, {
      order: 'name',
      order_direction: 'asc'
    })
  end

  def edit
    can_edit_users_only
    @user = User.find_by_id(params[:id])
    if !@user
      # If no user exists with given id, try looking up by WCA id.
      @user = User.find_by_wca_id!(params[:id])
      redirect_to edit_user_path(@user)
    end
  end

  def update
    can_edit_users_only
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
      redirect_to edit_user_url @user
    else
      flash[:danger] = "Error updating user"
      render :edit
    end
  end

  private def user_params
    user_params = params.require(:user).permit(*current_user.editable_other_user_fields)
    if user_params.has_key?(:delegate_status) && !User.delegate_status_allows_senior_delegate(user_params[:delegate_status])
      user_params["senior_delegate_id"] = nil
    end
    if user_params.has_key?(:wca_id)
      user_params[:wca_id] = user_params[:wca_id].upcase
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
