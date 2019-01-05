# frozen_string_literal: true

size_down_script = File.read("#{Rails.root}/public/images/organizations/size_down.sh")
MAX_WIDTH = /MAX_WIDTH=(.*)/.match(size_down_script)[1].to_i
MAX_HEIGHT = /MAX_HEIGHT=(.*)/.match(size_down_script)[1].to_i

RSpec.describe 'Organization images' do
  organization_image_dir = "#{Rails.root}/public/images/organizations"
  actual_images = Dir.entries(organization_image_dir) - [".", "..", "size_down.sh"]

  it "all exist, and there are no extras" do
    desired_images = StaticPagesController::ORGANIZATIONS_INFO.map { |org_info| org_info[:logo] }.reject(&:nil?)
    expect(actual_images).to match_array desired_images
  end

  actual_images.each do |image_name|
    # The dimensions of SVG files don't really affect the filesize, so we ignore them.
    next if File.extname(image_name) == ".svg"

    it "#{image_name} is <= #{MAX_WIDTH}x#{MAX_HEIGHT}" do
      image = MiniMagick::Image.open("#{organization_image_dir}/#{image_name}")
      width, height = image.dimensions
      if width > MAX_WIDTH || height > MAX_HEIGHT
        raise "#{width}x#{height} is larger than the allowed #{MAX_WIDTH}x#{MAX_HEIGHT}. Try running `WcaOnRails/public/images/organizations/size_down.sh` to fix this."
      end
    end
  end
end
