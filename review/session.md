## Review by [Xiao Chen], [A18528904]
## Review of [review group name(s)]

### 1. Project summary/implementation

#### a. Summary
_Summarize the project in a few sentences: what kind of documents does it take, what interface does it present, what does it extract?_
Input furniture into a space to test if a specific furniture fits. A history of the furniture is saved in the database. 

#### b. GUI/backend interface
_What is the programmatic interface between the GUI and the backend that sends the user document to the backend? Be specific: identify the URL route, the parameters, HTTP method, API call, etc._
The interface between the GUI and backend works well by storing the data extracted into the database. 

#### c. User data in the prompt
_Identify the place in the code/prompt where user data had an effect (e.g. templated into/included in the prompt, used to inform data that is part of the prompt)._


#### d. One confusing thing
_Identify one thing you find confusing in the implementation, and describe why it's confusing and what you tried reading to understand it._
A aesthetic match feature is implemented but it is confusing because the reasoning for why a furniture would match is very vague/not in depth. The logic for why something would or not depends on theme but it is hard to tell why something is good or not.

### 2. Suggestions

#### a. Optimization/improvement of existing features
_Suggest one thing you would try to substantially improve the cost, latency, or accuracy of the application without compromising on other aspects. Give a substantive argument for why it's a good idea, grounded in details of the implementation (not just "use a smaller model")._
Suggested for Ebay style listings with specific dimensions of furniture.

#### b. Extension/feature request
_Which of the official required extensions would you suggest for this project? How would you go about it? (The reviewee isn't forced to do this one; this is for you to think a little bit about what it would look like on an unfamiliar codebase)_


## Review by [Xiao Chen], [A18528904]
## Review of [Ashton]

### 1. Project summary/implementation

#### a. Summary
_Summarize the project in a few sentences: what kind of documents does it take, what interface does it present, what does it extract?_
Takes in recipe images, screenshots, or PDFs, extract ingredients into a checklist and user make edits based on availability. Recipes can be handwritten and if pdf, they are cut down to only the ingredients section. The interface presents the image of the recipe, followed by the list of ingredients below the image. Documents can be in other languages, (tested with spanish), but does not correctly identify or ingredients. A substition feature is implemented to recommend alternatives to the ingredients and this feature outputs in the input language.

#### b. GUI/backend interface
_What is the programmatic interface between the GUI and the backend that sends the user document to the backend? Be specific: identify the URL route, the parameters, HTTP method, API call, etc._
The backend saves the extracted data as a schema and will use it for future extractions for improved accuracy.

#### c. User data in the prompt
_Identify the place in the code/prompt where user data had an effect (e.g. templated into/included in the prompt, used to inform data that is part of the prompt)._
The system prompt take extracted data 

#### d. One confusing thing
_Identify one thing you find confusing in the implementation, and describe why it's confusing and what you tried reading to understand it._
One confusing thing in the implementation was the substitutions that the LLM makes. Because there is no control on the substitutions or customization for the user. If an user want to substitute to an option that is friendly to their diet, the interface does not allow for that. 

### 2. Suggestions

#### a. Optimization/improvement of existing features
_Suggest one thing you would try to substantially improve the cost, latency, or accuracy of the application without compromising on other aspects. Give a substantive argument for why it's a good idea, grounded in details of the implementation (not just "use a smaller model")._

#### b. Extension/feature request
_Which of the official required extensions would you suggest for this project? How would you go about it? (The reviewee isn't forced to do this one; this is for you to think a little bit about what it would look like on an unfamiliar codebase)_
