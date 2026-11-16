# Lesson-planning instructions for ChatGPT, Gemini, or Claude

Use the attached sample workbook to plan and prepare ONE lesson. Follow the approval workflow below before filling the workbook.



## Stage 1 — Think of the lesson content and present it for review

Act as a lesson-content author. Generate suitable content yourself using my preferences and the sample's structure. If I have not chosen a topic, propose an age/level-appropriate topic and state your assumptions. Ask only for essential missing information; otherwise make a clear proposal for me to review.

Present the proposed lesson in readable tables in the conversation, including:

- Topic, intended student level, learning goal, and suggested grid size.
- Arabic learning name and description.
- Every learning item: its English text, Arabic translation, cell language, and intended row/column.
- Every quiz: type, sequence, exact question or statement, correct answer, and any wrong-answer options.
- Counts of learning items and quizzes by type. For audio questions, identify the word/sentence I will need to record or upload separately.

Check translations, spelling, answer correctness, distractors, and whether each quiz is covered by the learning content. Keep the language and difficulty consistent. If you are uncertain about a translation or fact, flag it for review instead of presenting it as settled.

Do NOT create, fill, or modify a spreadsheet in this stage. End by asking me to approve the proposed content or request changes, then STOP and wait for my reply.

## Stage 2 — Revise and wait for explicit approval

Apply any corrections I request and show the revised proposal. A correction, a question, silence, or elapsed time is not approval. Do not proceed until I explicitly approve the final content, for example: **"Approved, create the sheet."**

## Stage 3 — Create the single-sheet workbook from approved content

Only after my approval, fill the workbook with exactly the approved content. Do not add new words, change answers, or add/remove quizzes while creating the file. If a substantive change is needed, explain it and obtain my approval first.

Return a downloadable .xlsx file if your current tools support creating files. If they do not, say so and return a UTF-8 CSV with the same headers for me to open in Excel/Google Sheets and save as a one-sheet .xlsx file. Do not claim to have attached a file that you cannot create. Do not upload anything to the admin website or Firebase.

The .xlsx file must have exactly one sheet named `Lesson Content`. Keep these exact column headers in row 1:

`Content Type | Sequence | Row | Column | Language | Text / Question | Quiz Type | Correct Answer | Wrong Answer 1 | Wrong Answer 2 | Wrong Answer 3`

Replace the sample content. Do not add instruction rows, extra sheets, world/level/lesson IDs, media URLs, or audio/image columns. I create worlds, levels, and lessons manually on the website and choose the receiving lesson when importing.

Follow these workbook rules:

1. Include ONE `Learning Name` row and ONE `Learning Description` row. Put their Arabic text in `Text / Question`; leave other fields blank.
2. Include ONE `Grid Size` row. Put the number of rows in `Row` (1–4) and columns in `Column` (1–2). The usual letter/word/translation layout is 3 rows and 1 column.
3. Use `Learning Cell` rows for learning content. `Sequence` is the learning ITEM number: 1, 2, 3, etc. Repeat that item number for its different cells. Each cell has a one-based Row and Column within the grid, a Language of English or Arabic, and its word or letter in Text / Question. Cells within an item must have unique coordinates. Only include content the lesson actually teaches. Omitted cells are absent; do not invent letters to fill blank boxes.
4. For a typical 3×1 item: row 1 is the English letter (if any), row 2 the English word, and row 3 the Arabic translation. Other grid layouts may use any English/Arabic cells.
5. Use `Quiz` rows for quizzes. Quiz Sequence is a separate consecutive sequence across ALL quiz types, starting at 1. It is independent of the learning item sequence. Each sequence must be unique. This sets saved quiz order. Group types in this order unless I request otherwise: text_multiple_choice, audio_multiple_choice, audio_typing, text_typing, true_false, arabic_voice_record.
6. Use these exact Quiz Type values:
   - `text_multiple_choice`: Text / Question contains the question (Arabic or English); Correct Answer contains the correct option. Wrong Answer 1–3 contain up to three distractors. Leave unused distractor boxes blank.
   - `audio_multiple_choice`: Correct Answer contains the correct option; Wrong Answer 1–3 contain distractors. Text / Question can be blank. Audio is uploaded separately in the web editor.
   - `audio_typing`: Correct Answer contains the expected English word/answer. Text / Question and all wrong-answer fields are blank. Audio is uploaded separately.
   - `text_typing`: Text / Question contains the Arabic or English question; Correct Answer contains the expected ENGLISH typed answer. Wrong-answer fields are blank.
   - `true_false`: Text / Question contains a statement; Correct Answer is exactly True or False. Wrong-answer fields are blank.
   - `arabic_voice_record`: This is the existing Reading Quiz. Put the ENGLISH word/sentence the student should read aloud in Text / Question. Leave Correct Answer and all wrong-answer fields blank.
7. Do not populate Sequence/Row/Column/Language on the two name/description rows. For quiz rows leave Row/Column/Language blank. For learning rows leave Quiz Type and answer fields blank.
8. No formulas, guessed audio links, or explanatory text inside cells that should be blank. Preserve Arabic text as Unicode. Use whole numbers for sequences and coordinates.
