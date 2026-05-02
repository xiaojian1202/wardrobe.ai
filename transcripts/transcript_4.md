# Transcript 4: Batch Processing & Sequential Verification

### User
The scanner is great for single items, but I want to be able to upload multiple items at once. Can we add batch processing? The minimum requirements are:
    - new UI endpoint that accepts multiple documents
    - have some kind of UI for guiding and tracking the user across all documents (e.g. inbox or queue system to support incremental work with "uncorrected" states)

### Response
I can implement a `/batch-scan` endpoint that iterates through multiple files. The backend will handle deduplication and AI extraction for each image in the list. I'll also need to update the frontend to support multi-file selection and a queue system so you can verify each item one-by-one after the scan.

### User
Will the active learning loop still work if I do them in a batch?

### Response
Yes. The core `extract_attributes` logic will remain the same. I'll ensure that the user's style context is fetched and applied to every item in the batch. The only major change is the UI flow—instead of a single form, we'll use a "Verification Queue" that guides you through each extracted item sequentially.

### User
If I upload items in batch and switch over to the wardrobe page, will the uploaded results be saved before verifying them?

### Response
Yes, they are saved as "drafts" in the background. If you leave the page and come back, the verification queue will resume exactly where you left off.

### User
[Runs batch upload with 6 images] The queue UI works when uploading multiple items. What are some upgrades that can improve system performance?

### Response
For performance, I can implement parallel processing. This would allow the backend to extract attributes for multiple images simultaneously, likely cutting that minute down to about 15 seconds.

I can also add a "Save for Later" button. This will move the item to a "Pending" tab so you can skip it without losing your progress in the main queue.

### User
Hold off on the suggestions for now. i want to stay within the scope of the project.
