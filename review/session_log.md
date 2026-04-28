## Session Log

### Prepared flow

*Fill this in before review day.*

**Document set:** *Have a set of 10 documents prepared to experiment with*  
*during the review. Most or all of them should require some meaningful corrections*  
*or augmentations from the user.*

**Demo document:** *Pick 1 you will demo live. Fill in the following for that 1 example (so reviewers can see the format):*

- Link directly to the document, which should be in your repo.
- What data is extracted? Can be a screenshot of the presented interface or e.g. the extracted JSON or YAML.
- What information is in the document that was *not* extracted? Can be a summary, but should have at least some specific examples.
- What corrections/user information was added to process the document?

Link: */review/doc/chelseaboot.webp*

### What data is extracted:

```json
{
  "is_clothing": true,
  "items": [
    {
      "category": "footwear",
      "sub_category": "shoe",
      "color": "black",
      "material": "leather",
      "vibe": "formal"
    }
  ]
}
```

In the image there are flowers and a wooden/glass background.
These elements were not extracted because the focus is the fashion item.

A correction that was made to change the 'sub_category' field from shoe to 'chelsea boot'. Shoes are too broad and therefore it is useful for the system to remember what type of shoe this is for the future.

---

### Live session

- Show how to upload and correct the document you chose for the above analysis,
do corrections, show off the app. If anything mismatches the prepared
outputs, note it in the session log by editing the pre-filled section above.
- Show the prompt that was used for the extraction.
- Allow each reviewer to upload and review a free choice of the remaining
documents. You can drive your demoing laptop as the project author, but take
direction from them, especially on how to correct or add information.

The project author should fill in the sections below in the same format as
above, during the session.

#### Reviewer 1

**Reviewer name:**

- What document was chosen:
- What data was extracted:
- What information is in the document that was *not* extracted:
- What corrections/augmentations were made:

---

#### Reviewer 2

*Copy the structure above for additional reviewers.*

---

### Full group

After uploading and correcting 3 documents, demo and answer the following:

**Aggregation:** *What aggregation/summarization is available in the
application across the 3 documents?*