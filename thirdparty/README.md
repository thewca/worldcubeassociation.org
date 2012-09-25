# Third party stuff

## PHPExcel
Used for generating results excel sheets for competition organisers. It's
also on github so Clement made it a submodule, to get it type `git submodule init` then `git submodule update`.

## reCAPTCHA
So far only used for [media submissions](http://worldcubeassociation.org/results/media_insertion.php).
Single file, included in our repository.

## JpGraph
Used for the [Age vs Speed](http://worldcubeassociation.org/results/misc/age_vs_speed.html)
statistic. Will likely soon be replaced by javascript charts or we'll ditch this statistic
anyway because of the date of birth privacy issue. So I recommend not using this for further
stuff and I don't want to commit it to our repo, but if you want to run the age-vs-speed
statistic locally, go [here](http://jpgraph.net/download/), get `jpgraph-3.0.7.tar.gz` and
extract the contents of its `src` folder into `/thirdparty/jpgraph`. The `Examples` folder
inside isn't needed.
