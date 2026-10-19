# cLAWSe
cLAWSe highlights clauses worth a closer look, explains them in plain English, and helps everyday people figure out what to check next when dealing with legal documents and complex jargon. 

## Inspiration

We encounter legal documents more often than we think in our everyday lives. Think employment contracts, tenancy agreements, subscription terms, privacy policies, and more. All the fine print can carry more weight than we realise. Yet, the University of Law has found that more than two-thirds of people either do not read or do not understand contracts they sign.

One psychological factor behind this phenomenon is cognitive overload. Complex jargon and lengthy clauses can make reading and understanding these documents mentally demanding, and we are unlikely to revisit these documents until we are suddenly faced with a problem.

Certainly, consulting qualified legal professionals is one option, while searching for answers ourselves in the vast sea of the Internet is another. However, both methods come with high monetary and time costs, leading many to prefer to take the easier way out: simply sign or click "agree" and hope nothing goes wrong.

This then begs the question: **What if everyday people could understand what they are agreeing to before they sign or click "agree"?**

By making the fine print easier to understand, could we help people identify potential issues and clarify their concerns before they become problems later down the road? This is where cLAWSe comes in.

## What it does

cLAWSe is an AI-assisted tool designed to help everyday people better understand the legal documents they encounter in daily life and identify what they may want to check before signing or agreeing.

Users can paste a legal document or set of terms into cLAWSe. It then:

- Summarises what the document is about
- Highlights clauses worth a closer look
- Explains highlighted clauses in plain English
- Identifies things the user may want to check
- Generates a suggested response when there is something worth raising
- Points users towards relevant Singapore legal resources when they need further help

cLAWSe does not determine whether a clause is legally valid or enforceable, and it does not provide case-specific legal advice. Its goal is to make legal documents less intimidating and help people know what to look into next.

## How I built it

cLAWSe was built as a responsive web application, allowing users to use cLAWSe comfortably across different screen sizes, including mobile devices.

The frontend was built with **HTML, CSS, and JavaScript**, with a minimalist interface designed to reduce the cognitive overload that can already come with reading complex legal documents. 

For the AI analysis, the **Google Gemini API** was used. The application sends the legal document to a backend API, which processes the request and returns:

 - Document type and summary
 - Highlighted clauses
 - Explanations for each highlighted clause in plain English
 - Items worth checking
 - A specialised content note when additional professional guidance may be useful
  - A suggested response where appropriate

Text matching between the AI-generated clause quotes and the original document was implemented, allowing relevant clauses to be highlighted directly within the document rather than presented separately.
 
An annotation-style experience was also designed to break down the dense document into smaller, key chunks that are easier to navigate and understand.

The interface uses colour-coded highlights to distinguish different levels of attention: red for clauses **"worth questioning"**, orange for clauses **"worth checking"**, yellow for clauses **"worth noting"**, and green for clauses **"worth knowing"**. 

Hovering over a highlighted clause reveals an explanation, which users can copy for reference. 
 
Furthermore, the AI is deliberately prompted to provide general legal information rather than definitive legal conclusions, reducing the risk of presenting AI-generated interpretations as professional legal advice.

**Claude and ChatGPT** were used as development assistants during the creation of cLAWSe. They were used to help with tasks such as debugging, explaining code, refining prompts, and suggesting test inputs. 

## Challenges I ran into

One of the biggest challenges was balancing **usefulness with safety**. Legal documents are highly context-dependent, and an AI system should not confidently tell users that a clause is invalid or unenforceable without understanding their individual circumstances and the applicable law. Therefore, the system prompt for the AI had to be carefully engineered to keep cLAWSe focused on identifying things worth checking, instead of making legal judgments.

Another challenge was mapping the AI-generated clauses back to the user's original document reliably. Small differences in whitespace, line breaks, or formatting could cause a clause to be highlighted incorrectly or not found at all. Thus, text normalisation and matching logic were implemented to make this process more robust.

Lastly, there was also a need to decide how much information to display. Too little information would make the tool less useful, while too much explanation would overwhelm users who are already struggling with a complicated document. This led to an experience structured around selective highlights, short explanations, and clear next steps.

## Accomplishments that I'm proud of
 
One accomplishment is creating a focused tool to address a broad problem and help everyday people better understand the legal documents they encounter in their daily lives.

Instead of returning a long AI-generated analysis that users have to read separately, cLAWSe adopts an annotation-style user experience and displays explanations directly within the original document through highlights and tooltips. 

Special care and attention has also been given to responsible AI use. cLAWSe is not a replacement for a lawyer and is solely designed to help users understand legal information better and identify possible concerns. 

## What I learnt

Working on a legal-focused project underscored the importance of defining clear boundaries for an AI system. In cLAWSe's case, knowing when to explain, when to flag something for further checking, and when to point users towards professional help is an important part of the product.

Seemingly small technical details also matter in product deployment. Reliable text matching, handling different document formatting, structuring model outputs, and designing a simple interface all play a significant role in making the final experience work seamlessly.

## What's next for cLAWSe

Future work may include making cLAWSe more robust and useful across a wider range of everyday legal documents.

Improvements could include:

 - More comprehensive coverage of Singapore-specific legal resources
 - Improved explanations with credible source grounding 
 - Better handling of complex document structures and formatting, including support for PDF and DOCX files
 - A sidebar providing an overview of the document structure, making it easier for users to navigate and find the information they need
 - More relevant legal resources recommended based on the issues identified in the legal document
 - Evaluation of the reliability of AI-generated responses 
