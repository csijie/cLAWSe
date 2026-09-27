const MODEL = "gemini-3.5-flash-lite";
const MAX_DOCUMENT_LENGTH = 50000;


/* ---------------------------------------
   TEXT CLEANING
--------------------------------------- */

function cleanText(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n") // Converts all line breaks into "\n"
    .replace(/\uFEFF/g, "")  // Removes all BOM characters
    .replace(/\u00A0/g, " ") // Converts all non-breaking spaces into normal spaces
    .split("\n") // Splits the text into lines
    .map(line => 
      line
        .replace(/[ \t]+/g, " ") // Converts all sequences of spaces and tabs into a single space
        .trim() // Removes leading and trailing whitespace
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n") // Converts 3 or more consecutive line breaks into 2 line breaks
    .trim(); // Removes leading and trailing whitespace
}


function cleanLetter(letter) {
  let cleaned = cleanText(letter);

  if (!cleaned) {
    return "";
  }

  const signOffIndex =
    cleaned
      .toLowerCase()
      .indexOf("best regards");

  if (signOffIndex !== -1) {
    cleaned =
      cleaned
        .slice(0, signOffIndex)
        .trim();
  }

  return `${cleaned}\n\nBest regards,\n[Your Name]`;
}


/* ---------------------------------------
   DOCUMENT PREPARATION
--------------------------------------- */

function prepareDocument(documentText) {
  return documentText
    .split("\n")
    .map(
      (line, index) =>
        `[LINE ${index + 1}] ${line}`
    )
    .join("\n");
}


/* ---------------------------------------
   QUOTE MATCHING
--------------------------------------- */

function normaliseForMatch(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00A0/g, " ")
    .split("\n")
    .map(line =>
      line
        .replace(/[ \t]+/g, " ")
        .trim()
    )
    .join("\n")
    .trim();
}


function findQuoteRanges(source, quote) {
  const normalisedSource =
    normaliseForMatch(source);

  const normalisedQuote =
    normaliseForMatch(quote);

  if (!normalisedQuote) {
    return [];
  }

  const ranges = [];
  let searchFrom = 0;

  while (
    searchFrom <
    normalisedSource.length
  ) {

    const index =
      normalisedSource.indexOf(
        normalisedQuote,
        searchFrom
      );

    if (index === -1) {
      break;
    }

    ranges.push({
      start: index,
      end:
        index +
        normalisedQuote.length
    });

    searchFrom =
      index +
      normalisedQuote.length;
  }

  return ranges;
}


/* ---------------------------------------
   FLAG VALIDATION
--------------------------------------- */

function prepareFlags(
  flags,
  source
) {
  if (!Array.isArray(flags)) {
    return [];
  }

  const normalisedSource =
    normaliseForMatch(source);

  const seen =
    new Set();

  const prepared = [];

  for (const flag of flags) {

    if (
      !flag ||
      typeof flag !== "object"
    ) {
      continue;
    }

    const quote =
      normaliseForMatch(
        flag.quote
      );

    if (!quote) {
      continue;
    }

    const ranges =
      findQuoteRanges(
        normalisedSource,
        quote
      );

    if (!ranges.length) {
      continue;
    }

    const start =
      ranges[0].start;

    const key =
      `${start}|${quote}`;

    if (seen.has(key)) {
      continue;
    }

    const severity =
      [
        "red",
        "orange",
        "yellow",
        "green"
      ].includes(
        flag.severity
      )
        ? flag.severity
        : "yellow";

    const explanation =
      typeof flag.explanation === "string"
        ? flag.explanation.trim()
        : "";

    const right =
      typeof flag.right === "string"
        ? flag.right.trim()
        : "";

    if (
      !explanation &&
      !right
    ) {
      continue;
    }

    prepared.push({
      severity,
      quote,
      explanation,
      right,
      start
    });

    seen.add(key);
  }

  prepared.sort(
    (a, b) =>
      a.start - b.start
  );

  const nonOverlapping = [];
  let previousEnd = -1;

  for (const flag of prepared) {

    const end =
      flag.start +
      flag.quote.length;

    if (flag.start < previousEnd) {
      continue;
    }

    nonOverlapping.push(flag);
    previousEnd = end;
  }

  return nonOverlapping.map(
    ({ start, ...flag }) =>
      flag
  );
}


/* ---------------------------------------
   WHAT TO CHECK
--------------------------------------- */

function prepareChecks(missing) {
  if (!Array.isArray(missing)) {
    return [];
  }

  return missing
    .filter(
      item =>
        typeof item === "string"
    )
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}


/* ---------------------------------------
   FINAL RESULT
--------------------------------------- */

function normaliseResult(
  result,
  source
) {
  const safe =
    result &&
    typeof result === "object"
      ? result
      : {};

  return {
    documentType:
      typeof safe.documentType === "string"
        ? safe.documentType.trim()
        : "Everyday legal document",

    summary:
      typeof safe.summary === "string"
        ? safe.summary.trim()
        : "",

    flags:
      prepareFlags(
        safe.flags,
        source
      ),

    missing:
      prepareChecks(
        safe.missing
      ),

    specialisedNote:
      typeof safe.specialisedNote === "string"
        ? safe.specialisedNote.trim()
        : "",

    letter:
      typeof safe.letter === "string"
        ? cleanLetter(safe.letter)
        : ""
  };
}


/* ---------------------------------------
   AI PROMPT
--------------------------------------- */

function buildPrompt(documentText) {
  const document =
    prepareDocument(
      documentText
    );

  return `
You are cLAWSe, an AI-assisted legal-document information and navigation tool for ordinary people in Singapore.

Your job is to help a reader understand what a document says, identify clauses worth paying attention to, explain those clauses in plain English, and suggest practical things the reader may want to check or ask about.

You are NOT a lawyer.
Do NOT provide legal advice.
Do NOT decide whether a clause is legal, illegal, valid, invalid, enforceable, unenforceable, fair, unfair, reasonable, or unreasonable.
Do NOT invent laws, rights, deadlines, penalties, or legal requirements.
Do NOT claim that a person definitely has or does not have a legal right.

If something depends on the person's specific circumstances or current Singapore law, frame it as something to check or ask a qualified professional about.


IMPORTANT DOCUMENT-REVIEW METHOD

Review the ENTIRE document from beginning to end, section by section.

Do not treat this as a "top 2 risks" detector.

Consider all substantive parts of the document, including where relevant:

- payment obligations
- fees and charges
- cancellation
- renewal
- termination
- notice periods
- deposits
- refunds
- warranties
- liability
- indemnities
- exclusions
- restrictions
- obligations
- deadlines
- data/privacy provisions
- dispute procedures
- governing law
- employment conditions
- tenancy conditions
- service limitations
- changes to terms
- automatic renewal
- consequences of non-compliance
- unusual or especially important definitions
- practical requirements that could materially affect the reader

However, DO NOT highlight everything.

Only select clauses that are genuinely useful for the reader to notice.

A short, simple and largely routine document may need only a few flags.
A longer document with many substantive provisions may reasonably need more flags.

Do not force a fixed number of flags.
Do not add filler merely to increase the number of highlights.


HIGHLIGHT SELECTION

Each highlight must quote a meaningful, contiguous passage from the supplied document.

The quote should normally be:

- a complete sentence,
- a complete bullet point,
- a complete provision,
- or a small contiguous group of sentences/paragraphs.

Do NOT quote random isolated phrases if their meaning depends on surrounding text.

The highlighted passage must contain enough context for the explanation to make sense on its own.

Where possible, include the:

- subject,
- action or obligation,
- condition,
- timeframe,
- exception,
- consequence,
- amount,
- or other context

needed to understand why the clause matters.

At the same time, do NOT quote the whole document or unnecessarily large sections.

The ideal quote is the smallest contiguous passage that still gives the reader enough context to understand the explanation.

Do not create overlapping highlights.
Do not duplicate the same clause.
Do not split one coherent provision into several highlights unless the document clearly contains separate substantive issues.


SEVERITY

Use exactly one of these severities:

red:
"WORTH QUESTIONING"
Something the reader may want to clarify, challenge, negotiate, or ask why.

orange:
"WORTH CHECKING"
Something the reader should verify before signing, paying, cancelling, renewing, or acting.

yellow:
"WORTH NOTING"
Important information the reader should understand or be aware of, but which does not necessarily require immediate action.

green:
"WORTH KNOWING"
Useful context or information that helps the reader understand the document.

These labels are about practical attention, NOT legal conclusions.


EXPLANATIONS

Explain the highlighted passage in plain English.

The explanation should:

- describe what the clause says,
- explain why it may matter practically,
- avoid legal conclusions,
- avoid jargon where possible,
- and be understandable from the highlighted passage alone.

The explanation should not merely repeat the clause word-for-word.

If useful, "right" can contain a short practical next step, such as:

- "You may want to ask when the notice period starts."
- "Check whether this fee is included in the quoted price."
- "Consider confirming what happens if you cancel after the renewal date."

Do not state that the reader definitely has a legal right unless that right is explicitly stated in the supplied document.


WHAT TO CHECK

The "missing" field is NOT for missing documents or missing information.

It should contain practical questions or checks the reader may want to make after reading the document.

Examples:

- "Check whether the subscription renews automatically."
- "Ask what happens to the deposit if the agreement ends early."
- "Confirm whether the quoted price includes the additional service fee."
- "Check the notice period required for cancellation."

Only include useful, document-specific checks.
Do not invent checks that are unrelated to the supplied document.
Use at most 12.


SPECIALISED CONTENT

Assess whether the document contains highly specialised, technical, professional, or legally complex content that an ordinary reader may have difficulty interpreting reliably.

Examples may include:

- highly technical legal instruments,
- complex regulatory documents,
- specialised financial or investment documents,
- detailed corporate or commercial agreements,
- complex intellectual-property documents,
- complex tax documents,
- specialised employment or regulatory arrangements,
- highly technical insurance wording,
- documents whose meaning depends heavily on specialised professional knowledge.

Do NOT call a normal employment contract, tenancy agreement, consumer contract, subscription, privacy policy, or ordinary terms and conditions "highly specialised" merely because it contains legal language.

If the document is highly specialised, provide a short neutral note in "specialisedNote".

The note must be separate from the suggested response.

Use wording similar to:

"This document contains highly specialised content. You may wish to consult a qualified professional for advice specific to your situation."

Do not put this warning inside "letter".

If the document is not highly specialised, return an empty string for "specialisedNote".


SUGGESTED RESPONSE

The "letter" field should normally contain a suggested response when the analysis identifies something that the reader may reasonably want to clarify with the other party.

In particular:

- If there is at least one red "WORTH QUESTIONING" flag, provide a suggested response.
- If there is at least one orange "WORTH CHECKING" flag, provide a suggested response.
- If the document is highly specialised and there is a reasonable reason for the reader to seek clarification from the other party, provide a suggested response as well.
- If there is nothing that reasonably calls for contacting the other party, return an empty string.

The suggested response should be:

- short,
- neutral,
- polite,
- practical,
- and directly related to the document.

It should ask for clarification rather than make accusations or legal conclusions.

Do not make the suggested response aggressive or threatening.
Do not make legal claims.
Do not cite laws unless they are explicitly provided in the document.

Do not include a subject line.

Do NOT include any sign-off or signature.

Do NOT write:

- "Best regards"
- "Best regards, [Your Name]"
- a person's name as a signature
- "[Your Name]"
- any other closing/signature

The application will add the standard sign-off automatically.

IMPORTANT:

The "specialisedNote" and "letter" are TWO SEPARATE FIELDS.

The specialised warning must NEVER be included inside the suggested response.

The suggested response must contain ONLY the email/message itself.


DOCUMENT

The document is supplied below.

The [LINE n] markers are only for your internal reference.
Do not include them in quotes or explanations.

${document}


RETURN FORMAT

Return ONLY valid JSON.

Use exactly this structure:

{
  "documentType": "short description of the document",
  "summary": "brief plain-English summary of what the document is about",
  "flags": [
    {
      "severity": "red",
      "quote": "exact contiguous passage copied from the document",
      "explanation": "plain-English explanation",
      "right": "optional practical next step"
    }
  ],
  "missing": [
    "practical question or check"
  ],
  "specialisedNote": "",
  "letter": ""
}

IMPORTANT:

- Every quote must come from the supplied document.
- Preserve the wording of the quoted passage.
- Quotes may be normalised only for whitespace.
- Do not invent text.
- Do not use markdown.
- Do not return anything outside the JSON object.
`;
}


/* ---------------------------------------
   JSON EXTRACTION
--------------------------------------- */

function extractJson(text) {
  let cleaned =
    String(text || "").trim();

  cleaned =
    cleaned
      .replace(
        /^```json\s*/i,
        ""
      )
      .replace(
        /^```\s*/i,
        ""
      )
      .replace(
        /\s*```$/i,
        ""
      )
      .trim();

  const firstBrace =
    cleaned.indexOf("{");

  const lastBrace =
    cleaned.lastIndexOf("}");

  if (
    firstBrace === -1 ||
    lastBrace === -1 ||
    lastBrace <= firstBrace
  ) {
    throw new Error(
      "Gemini returned an invalid JSON response."
    );
  }

  return JSON.parse(
    cleaned.slice(
      firstBrace,
      lastBrace + 1
    )
  );
}


/* ---------------------------------------
   GEMINI REQUEST
--------------------------------------- */

async function requestGemini(
  prompt,
  apiKey
) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const response =
    await fetch(
      url,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "x-goog-api-key":
            apiKey
        },

        body: JSON.stringify({

          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],

          generationConfig: {
            temperature: 0.2,

            responseMimeType:
              "application/json",

            maxOutputTokens: 8192
          }

        })
      }
    );

  const responseText =
    await response.text();


  if (!response.ok) {

    console.error(
      "Gemini API response:",
      responseText
    );


    if (response.status === 400) {
      throw new Error(
        "Gemini rejected the request. Check the API key, model name, or request format."
      );
    }


    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new Error(
        "Gemini API authentication failed. Check GEMINI_API_KEY."
      );
    }


    if (response.status === 429) {
      throw new Error(
        "The AI service is temporarily rate-limited. Please try again shortly."
      );
    }


    if (response.status === 503) {
      throw new Error(
        "The AI service is temporarily unavailable. Please try again shortly."
      );
    }


    throw new Error(
      `Gemini API error (${response.status}).`
    );
  }


  let data;

  try {

    data =
      JSON.parse(
        responseText
      );

  } catch {

    console.error(
      "Invalid Gemini response:",
      responseText
    );

    throw new Error(
      "Gemini returned an invalid response."
    );
  }


  const text =
    data
      ?.candidates?.[0]
      ?.content?.parts?.[0]
      ?.text;


  if (!text) {

    console.error(
      "Unexpected Gemini response:",
      JSON.stringify(data)
    );

    throw new Error(
      "Gemini did not return an analysis."
    );
  }


  return text;
}


/* ---------------------------------------
   API HANDLER
--------------------------------------- */

export default async function handler(
  req,
  res
) {

  if (req.method !== "POST") {

    return res
      .status(405)
      .json({
        error:
          "Method not allowed."
      });
  }


  try {

    const apiKey =
      process.env.GEMINI_API_KEY;


    if (!apiKey) {

      return res
        .status(500)
        .json({
          error:
            "GEMINI_API_KEY is not configured."
        });
    }


    const documentText =
      typeof req.body?.documentText ===
      "string"
        ? req.body.documentText
        : "";


    const cleanedDocument =
      cleanText(
        documentText
      );


    if (!cleanedDocument) {

      return res
        .status(400)
        .json({
          error:
            "Please provide a document to analyse."
        });
    }


    if (
      cleanedDocument.length >
      MAX_DOCUMENT_LENGTH
    ) {

      return res
        .status(400)
        .json({
          error:
            "This document is too long. Please provide a document under 50,000 characters."
        });
    }


    const prompt =
      buildPrompt(
        cleanedDocument
      );


    const rawResponse =
      await requestGemini(
        prompt,
        apiKey
      );


    const parsed =
      extractJson(
        rawResponse
      );


    const result =
      normaliseResult(
        parsed,
        cleanedDocument
      );


    return res
      .status(200)
      .json(result);


  } catch (error) {

    console.error(
      "cLAWSe analysis error:",
      error
    );


    return res
      .status(500)
      .json({
        error:
          error instanceof Error
            ? error.message
            : "Unable to analyse the document."
      });
  }
}