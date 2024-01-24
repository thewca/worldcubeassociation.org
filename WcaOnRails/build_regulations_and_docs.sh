commit_hash() {
  REMOTE_URL=$1
  REMOTE_BRANCHNAME=$2

  echo $(git ls-remote $REMOTE_URL $REMOTE_BRANCHNAME | sed 's/\(.\{7\}\).*/\1/')
}
# Build WCA regulations
# Uses wrc, see here: https://github.com/thewca/wca-regulations-compiler
# pdf generations relies on wkhtmltopdf (with patched qt), which should be in $PATH
build_folder=/rails/regulations/build
wrc_tool_path=/root/.local/pipx/venvs/wrc/bin
regs_folder_root=/rails/app/views
tmp_dir=/rails/tmp/regs-todelete
regs_folder=$regs_folder_root/regulations
regs_version=$regs_folder/version
regs_data_version=$regs_folder/data_version
translations_version=$regs_folder/translations/version
echo "creating build folder"
rm -rf $build_folder
mkdir -p $build_folder

# The /regulations directory build relies on three sources:
#  - The WCA Regulations
#  - The WCA Regulations translations
#  - The 'regulations-data' branch of this repo, which contains data such as TNoodle binaries
echo "getting commit hashes"
git_reg_hash=$(commit_hash "https://github.com/thewca/wca-regulations.git" official)
git_translations_hash=$(commit_hash "https://github.com/thewca/wca-regulations-translations.git" HEAD)
git_reg_data_hash=$(commit_hash "https://github.com/thewca/worldcubeassociation.org.git" regulations-data)

echo "build regulations"

# This saves tracked files that may have unstashed changes too
cp -r $regs_folder $build_folder

# Checkout data (scramble programs, history)
# Assuming we ran pull_latest, this automatically checks out the latest regulations-data
echo "checking out regulations-data"
git clone https://github.com/thewca/worldcubeassociation.org.git --branch regulations-data /rails/tmp/regulations_data
mv /rails/tmp/regulations_data/regulations $build_folder/regulations
rm -rf /rails/tmp/regulations_data
echo "checked out regulations-data"

inputdir=$build_folder/wca-regulations-translations
outputdir=$build_folder/regulations/translations
mkdir -p $outputdir

echo "building translations"
git clone --depth=1 https://github.com/thewca/wca-regulations-translations.git $inputdir
languages=$($wrc_tool_path/wrc-languages)
# Clean up translations directories
find $outputdir ! -name 'translations' -type d -exec rm -rf {} +
# Rebuild all translations
for kind in html pdf; do
  for l in $languages; do
    lang_inputdir=$inputdir/${l}
    lang_outputdir=$outputdir/${l}
    mkdir -p $lang_outputdir
    echo "Generating ${kind} for language ${l}"
    $wrc_tool_path/wrc --target=$kind -l $l -o $lang_outputdir -g $git_translations_hash $lang_inputdir
    # Update timestamp for semi-automatic computation of translations index
    cp $lang_inputdir/metadata.json $lang_outputdir/
  done
done
# Update version built
echo "$git_translations_hash" > $outputdir/version
# Update timestamps for automatically determining which regulations are up to date
cp $inputdir/version-date $outputdir/

inputdir=$build_folder/wca-regulations
outputdir=$build_folder/regulations
mkdir -p $outputdir

echo "building regulations"
git clone --depth=1 --branch=official https://github.com/thewca/wca-regulations.git $inputdir
# Clean up regulations directory files
find $outputdir -maxdepth 1 -type f -exec rm -f {} +
# Rebuild Regulations
$wrc_tool_path/wrc --target=json -o $outputdir -g "$git_reg_hash" $inputdir
$wrc_tool_path/wrc --target=html -o $outputdir -g "$git_reg_hash" $inputdir
$wrc_tool_path/wrc --target=pdf -o $outputdir -g "$git_reg_hash" $inputdir
# Update version built
echo "$git_reg_hash" > $outputdir/version

# Update regulations-data version built
echo "$git_reg_data_hash" > $outputdir/data_version

rm -rf $tmp_dir
mv $regs_folder $tmp_dir
mv $outputdir $regs_folder
mv $regs_folder/regulations/build/regulations/history/* $regs_folder/history
mv $regs_folder/regulations/build/regulations/scrambles/* $regs_folder/scrambles
rm -rf $tmp_dir

echo "building documents"
public_dir=/rails/public
tmp_dir=/rails/tmp/wca-documents-clone

git clone --depth=1 --branch=build https://github.com/thewca/wca-documents.git $tmp_dir
rm -rf $public_dir/documents
rm -rf $public_dir/edudoc
mv $tmp_dir/documents $tmp_dir/edudoc $public_dir
rm -rf $tmp_dir
