## Review by [Xiao Chen], [A18528904]

## Review of [Ashton]

### 1. Project summary/implementation

#### a. Summary

*Summarize the project in a few sentences: what kind of documents does it take, what interface does it present, what does it extract?*

Takes in recipe images, screenshots, or PDFs, extract ingredients into a checklist and user make edits based on availability. Recipes can be handwritten and if pdf, they are cut down to only the ingredients section. The interface presents the image of the recipe, followed by the list of ingredients below the image. Documents can be in other languages, (tested with spanish), but does not correctly identify or ingredients. A substition feature is implemented to recommend alternatives to the ingredients and this feature outputs in the input language.

#### b. GUI/backend interface

*What is the programmatic interface between the GUI and the backend that sends the user document to the backend? Be specific: identify the URL route, the parameters, HTTP method, API call, etc.*

When scanning a document, the GUI will send the document to the backend via a /upload URL. If the user is running locally, the URL route would look like "[https://localhost:8000/upload](https://localhost:8000/upload)". The parameter takes a "file" form field containing the uploaded file's binary and reject anything else with HTTP response code 415. The HTTP method being used is POST. The system's api call for /upload uses the fetch API: res = await fetch(`http://localhost:8000/upload`, { method: 'POST', body })

#### c. User data in the prompt

*Identify the place in the code/prompt where user data had an effect (e.g. templated into/included in the prompt, used to inform data that is part of the prompt).*
Raw input of images and PDFs are converted into images by passing through 3 step filters. User data is used to be included into the prompt by storing few shot examples into the database. These examples are loaded into the system prompt if a user make edits to the output list.

#### d. One confusing thing

*Identify one thing you find confusing in the implementation, and describe why it's confusing and what you tried reading to understand it.*
One confusing thing in the implementation was the substitutions that the LLM makes. Because there is no control on the substitutions or customization for the user. If an user want to substitute to an option that is friendly to their diet, the interface does not allow for that. How and what logic does the LLM use to determine if a different ingredient is a good substitution?

### 2. Suggestions

#### a. Optimization/improvement of existing features

*Suggest one thing you would try to substantially improve the cost, latency, or accuracy of the application without compromising on other aspects. Give a substantive argument for why it's a good idea, grounded in details of the implementation (not just "use a smaller model").*

Since the first layer uses an LLM to make inference on pdf documents, it can be costly. It could be to possible to extract the pdf's metadata and filter for keywords and use text-based models filter the top 3 pages with highest confidence.

#### b. Extension/feature request

*Which of the official required extensions would you suggest for this project? How would you go about it? (The reviewee isn't forced to do this one; this is for you to think a little bit about what it would look like on an unfamiliar codebase)*

I recommend authentication because different users have different food preferences. As more users as use this, the few shot correction should be stored exclusively to a user so that the system learns for a specific user. I would start from the backend to include user tables in the database so that there are exclusive user ids in each unique ingredient and recipe entry. the front end will some type of login screen for user authentication and have a restriction so that only unique users can only modify their lists.

## Review by [Xiao Chen], [A18528904]

## Review of [Madhoolika]

### 1. Project summary/implementation

#### a. Summary

*Summarize the project in a few sentences: what kind of documents does it take, what interface does it present, what does it extract?*

The app is designed to take an image of a room and then PDFs of the furniture's spec doc. The system will output the spatial and aesthetic compatibility in the user's input space. Spatial compatibility considers the walking space around the furniture, how much is there if the furniture is placed near windows or doors, and how does the furniture fit in the room given its product dimensions. Aesthetic compatibility considers, color palette, style of the furniture, balance of looks with the materials. The web UI allow users to upload the furniture spec pdf and the room image and edit specifications. 

#### b. GUI/backend interface

*What is the programmatic interface between the GUI and the backend that sends the user document to the backend? Be specific: identify the URL route, the parameters, HTTP method, API call, etc.*

The programmatic interface that sends the document from the GUI to the backend is via a POST request at /upload. This creates a new project with a room image and furniture pdf. The URL is at [https://localhost:8000/upload](https://localhost:8000/upload). The api call to make the request is found using uploadProject(roomImage, furniturePdf, onProgress?). The content type is form-data.

#### c. User data in the prompt

*Identify the place in the code/prompt where user data had an effect (e.g. templated into/included in the prompt, used to inform data that is part of the prompt).*

Users can overwrite the AI's extracted values such room size. The system reads the furniture PDF to extract dimensions and include this information in the AI's prompt. The system then use user data to write improved instructions for aesthetic and reasoning scoring. An example would be the style of the room and well the furniture fits with the style.

#### d. One confusing thing

*Identify one thing you find confusing in the implementation, and describe why it's confusing and what you tried reading to understand it.*

A aesthetic match feature is implemented but it is confusing because the reasoning for why a furniture would match is very vague/not in depth. There is no clear balance on how spatial fit and aesthetic fit are combined or utilized to make the final decision. I looked at the scoring directory for how the scoring is evaluated to help me understand further. In aesthetic.py it only consider the color, style, and material. In spatial.py, a separate score is used for the space a furniture piece takes and its clearance in the room. In reasoning.py, it receives a overall_score float but it is confusing because it's unclear how this value is determined. It seem like the decision made by the LLM.

### 2. Suggestions

#### a. Optimization/improvement of existing features

*Suggest one thing you would try to substantially improve the cost, latency, or accuracy of the application without compromising on other aspects. Give a substantive argument for why it's a good idea, grounded in details of the implementation (not just "use a smaller model").*

The style scoring logic could be moved from aesthetic.py to reasoning.py because in reasoning.py, it takes image inputs using visual data. Utilizing a visual model makes sense than a text model or text input with to perform aesthetics check so visual details can be captured with more accuracy. While it is more cost effective, having a good balance with visual accuracy is a good trade off to make aesthetic checks more accurate because utilizing a visual model already increase overall latency .

#### b. Extension/feature request

*Which of the official required extensions would you suggest for this project? How would you go about it? (The reviewee isn't forced to do this one; this is for you to think a little bit about what it would look like on an unfamiliar codebase)*

I suggest implementing the batch mode for users. Personally, I think it would be useful to take multiple pieces of furniture to see how well they match the room together. For example, if I was moving into an apartment, I want to use how the room looks with a bed, desk, and closet. This seem most useful for users because allowing batch inputs is a realistic use scenario where users want to look at how different decorations look together. I would change the extraction logic to implement a queue system for extracting data from multiple PDFs when batch uploading.