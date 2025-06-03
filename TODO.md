# TODO

## Article Extraction

- [ ] Start extracting articles automatically after the page has finished loading
- [ ] Automatically insert prompts and execute in AI services

## UI

- [ ] Implement float buttons
- [ ] Implement tab detection for opening summaries
- [ ] Display a toast dialog when article extraction is complete
  - When the tab becomes active
  - If `isShowMessage` on `GlobalContext` is true
  - If there is a record where `url` matches and `is_extracted` is `true`
- [ ] Display the badge after article extraction is complete
  - When the tab becomes active
  - If `isShowBadge` on `GlobalContext` is true
  - If there is a record where `url` matches and `is_extracted` is `true`
- [ ] Copy the article text to the clipboard when extraction is complete
- [ ] Add settings for each AI service
