# Regulations Release Process

For all official `wca-documents` updates:

- Announcement
    - Create a (proposed) announcement in `announcements`. This will be used/updated several times.
    - Include a summarized list of changes.
    - Follow previous formatting.
- Board approval
    - Email the for Board the proposal for changes (announcement + diff).
    - Get explicit Board approval.
- Git
    - Create a `wca-documents` commit with all the changes, and the new date.
    - Update `wca-documents/official` to point to it.
    - Tag the official release commit with `official-YYYY-MM-DD`.
    - Push to [GitHub](https://github.com/cubing/wca-documents).
- Web
    - Build wca-documents-extra using `./make -w`
    - Upload to the WCA server.
- Post Announcement
    - Release only Monday/Tuesday if possible, Wednesday is okay. See [the first WRC announcement](https://www.worldcubeassociation.org/regulations/announcements/introducing-wrc-announcements). (Does not apply to the yearly change, which should go into effect Jan. 1.)
    - Make sure links are up to date, and the date the changes go into effect is listed.
    - [WCA Homepage](https://www.worldcubeassociation.org/) Drupal
        - Log into Drupal and go to Content > Create Content > WRC Announcement
        - Change the text format to "Full HTML" (there isn't a way to set this as default. :-( ).
        - Change the URL path setting. Look at past posts for the appropriate format.
    - [WCA forum](https://www.worldcubeassociation.org/forum/viewforum.php?f=9) - one thread per year
    - Email `wca-delegates` list.
- Update the [WCA Regulations History](https://www.worldcubeassociation.org/regulations/history/)
