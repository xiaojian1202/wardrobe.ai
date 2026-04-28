# Review Session Preparation: FitCheck AI

## 1. Recommended Document Set (10 Images)

These images are selected to demonstrate the **User-in-the-Loop** and **Active Learning Loop** requirements by requiring meaningful human intervention.

| # | Document Type | Expected AI Result | Suggested Correction / Augmentation |
| :--- | :--- | :--- | :--- |
| 1 | **Mirror Selfie (Hoodie)** | `vibe: casual` | Correct to `streetwear` to teach the AI personal style. |
| 2 | **Close-up (Leather Jacket)** | `material: unknown` | Augment with `vegan leather` based on visual texture. |
| 3 | **Chelsea Boots** | `category: footwear` | Refine sub-category to `chelsea boots` for specific cataloging. |
| 4 | **Striped Shirt** | `color: blue` | Correct to `blue/white striped` to capture pattern detail. |
| 5 | **Pinterest Trench Coat** | `category: upper-body` | Refine to `outerwear` (Triggers Learning Loop for jackets). |
| 6 | **Minimalist Watch** | `category: accessory` | Refine sub-category from `jewelry` to `watch`. |
| 7 | **Low-Light Black Shirt** | `color: unknown` | Specify `midnight black` based on human context. |
| 8 | **Clothing Care Tag** | `material: cotton` | Augment with `Size: Medium` extracted from tag OCR text. |
| 9 | **Jumpsuit / Romper** | `category: upper-body` | Correct to `full-body` (Tests DeepFashion taxonomy). |
| 10 | **Non-Clothing (Laptop)** | `is_clothing: true`? | **Experiment:** Show the AI correctly rejecting it via Gatekeeper logic. |

---

## 2. Demo Document (Live Presentation)

### Direct Link to Document
`backend/data/test_images/positive_3.jpg` (Vintage Utility Jacket)

### What data is extracted?
```json
{
  "is_clothing": true,
  "items": [
    {
      "category": "upper-body",
      "sub_category": "jacket",
      "color": "brown",
      "material": "unknown",
      "vibe": "casual"
    }
  ]
}
```

### What information is in the document that was not extracted?
While the AI correctly identified the core attributes, it missed several high-value "human" details visible in the photo:
- **Specific Material:** The jacket is clearly made of **heavy-duty canvas (duck cloth)**.
- **Functional Details:** The image shows a **corduroy-lined collar** and **brass utility rivets**, which are key to its "Workwear" aesthetic.
- **Color Precision:** The shade is a specific **Tan/Tobacco**, whereas the AI simplified it to generic "brown."

### What corrections/user information was added to process the document?
During the live demo, the following human-in-the-loop actions were performed:
1. **Taxonomy Refinement:** Changed category from `upper-body` to `outerwear`.
2. **Material Augmentation:** Manually typed `Heavy Canvas` after visual inspection.
3. **Vibe Correction:** Replaced `casual` with `vintage workwear` to improve future searchability.
4. **Learning Loop Trigger:** By verifying this item as `outerwear`, the system creates a user preference that will automatically categorize future jackets as `outerwear` rather than `upper-body`.
