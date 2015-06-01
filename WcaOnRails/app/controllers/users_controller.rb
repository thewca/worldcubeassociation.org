class UsersController < ApplicationController
  # For now, only allow admins to view this, as we're showing email addresses here
  before_action :authenticate_user!
  before_action :admin_only

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
    if @user == current_user && !new_admin
      flash[:danger] = "You cannot resign from your role as admin! Find another admin to fire you."
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
    user_params = params.require(:user).permit(*UsersController.WCA_ROLES, :delegate_status, :senior_delegate_id)
    if !User.delegate_status_requires_senior_delegate(user_params[:delegate_status])
      user_params["senior_delegate_id"] = nil
    end
    user_params
  end

  private def admin_only
    unless current_user && current_user.admin?
      flash[:danger] = "Admins only"
      redirect_to root_url
    end
  end
end
