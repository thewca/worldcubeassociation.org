class DeviseUsersController < ApplicationController
  # For now, only allow admins to view this, as we're showing email addresses here
  before_action :authenticate_devise_user!
  before_action :admin_only

  def self.WCA_ROLES
    [:admin, :results_team]
  end

  def index
    @users = DeviseUser.order(email: :asc).paginate(page: params[:page])
  end

  def edit
    @user = DeviseUser.find(params[:id])
  end

  def update
    @user = DeviseUser.find(params[:id])
    new_admin = ActiveRecord::Type::Boolean.new.type_cast_from_user(user_params[:admin])
    if @user == current_devise_user && !new_admin
      flash[:danger] = "You cannot resign from your role as admin! Find another admin to fire you."
      render :edit
    elsif @user.update_attributes(user_params)
      flash[:success] = "User updated"
      redirect_to edit_devise_user_url @user
    else
      flash[:danger] = "Error updating user"
      render :edit
    end
  end

  private def user_params
    params.require(:devise_user).permit(*DeviseUsersController.WCA_ROLES)
  end

  private def admin_only
    unless current_devise_user && current_devise_user.admin?
      flash[:danger] = "Admins only"
      redirect_to root_url
    end
  end
end
