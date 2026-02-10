bundle config set path vendor/bundle
bundle install
# remove old zip if it exists
rm -f processing_status.zip
zip -r processing_status.zip processing_status.rb vendor
# remove any bundler or vendor files
rm -rf .bundle
rm -rf vendor
