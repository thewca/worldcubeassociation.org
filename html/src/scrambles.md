# WCA Scrambles

The current official scramble program is *TNoodle-0.7.10.jar*. It generates high-quality scramble sequences for all the events of a competition at once.
  
<br>
<center><span style="font-size: 200%; line-height: 150%; padding: 0.5em;">
Download the official scramble program:<br><a href="tnoodle/TNoodle-0.7.10.jar" style="font-weight: bold;">TNoodle-0.7.8.jar</a><br></span>
<br>
Last official change: April 26, 2013
</center>

## Important Notes for Delegates

- Official competitions must always use the current version of the official scramble program.
- Delegates should download TNoodle to run it on a computer. They should not use TNoodle running on a public server (for security reasons).
- Delegates must save all scramble sequences generated for an official competition, and send them with the delegate report (see [Regulation 1c3a](../#1c3a)).

## Detailed Instructions for TNoodle

1. Run the *TNoodle-0.7.8.jar* file on your computer.  
  It will open the page <http://localhost:8080/scramble> in your browser.
2. Enter the details for your competition (competition name, number of rounds for each event, details for each round).  
  If you would like to password protect the file, enter a password.
3. Wait for the loading bar to finish and click the "Scramble!" button that appears.  
  A *.zip* file will download in your browser.

### Notes

- 4x4x4 scramble sequences **may take a few minutes** to initialize and generate.
  If you are generating 4x4x4 scramble sequences, be patient while the loading bar may appear to be stuck.
- TNoodle creates a *tnoodle_resources* folder with a few MB of files (mostly cached tables) in the same folder it is run.  
  Keep this folder if you want to generate more 4x4x4 scramble sequences more quickly in the future, but feel free to delete it if you need to reclaim disk space.
- TNoodle performs scramble filtering according to rules set by the WCA Board. Check its readme if you would like to know the current rules.

## About TNoodle

TNoodle uses code developed or adapted by Jeremy Fleischman, Ryan Zheng, Cl&eacute;ment Gallet, Shuang Chen, Bruce Norskog, and Lucas Garron. View the [TNoodle project on GitHub](https://github.com/cubing/tnoodle) to view the source, report an issue, or contribute to its development.
