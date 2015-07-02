# Scramble Program Release Process

- Follow appropriate parts of the process from the `wca-documents` update.
- Release only on Monday, except for extremely critical updates.
- On the scramble page, update:
    - All mentions of the current scramble program version.
    - List the latest update.
    - Update the list of old versions.
- Update [the API](https://github.com/cubing/wca-website/tree/api) with the new version.
- Create a [WRC Announcement](https://www.worldcubeassociation.org/regulations/announcements/)
  - Past announcements are in `./announcements`
  - In Drupal make sure to:
    - Create a WRC announcement (Content > Create content > WRC Announcement)
      - This [direct link](https://www.worldcubeassociation.org/node/add/wrc-announcement) should also work if you're logged into Drupal.
    - Set the "Text format" to "Full HTML".
    - Set a URL path (e.g. `tnoodle-0-8-4`)