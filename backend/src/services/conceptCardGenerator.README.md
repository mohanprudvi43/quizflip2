# ConceptCard Generator Module

## Folder Structure

- `backend/src/routes/adminRoutes.js`
  - PDF upload endpoints for flashcards and conceptcards.
- `backend/src/controllers/adminController.js`
  - Handles admin upload/preview/save flows.
- `backend/src/services/pdfFlashcardService.js`
  - Extracts text from PDF and generates ConceptCards.
- `backend/src/services/aiConceptCardService.js`
  - Example OpenAI integration for AI concept card generation.
- `backend/src/models/Flashcard.js`
  - Stores both legacy flashcard fields and new concept-card fields.

## API Endpoint

- `POST /api/admin/domains/:domainId/conceptcards/upload-pdf`
- Form data:
  - `pdf`: PDF file
  - `overwrite`: `true|false`
  - `preview`: `true|false`

## Output JSON Shape

```json
{
  "subject": "",
  "chapter": "",
  "concept_title": "",
  "definition": "",
  "key_points": [],
  "short_explanation": "",
  "diagram": "",
  "memory_trick": ""
}
```

## Notes

- Diagram fallback is auto-generated as ASCII flow if no diagram is found.
- Existing flashcard fields (`front`, `back`, `mcqOptions`) are preserved for app compatibility.

## Optional AI Enrichment

Set the following environment values in `backend/.env`:

- `ENABLE_AI_CONCEPT_CARDS=true`
- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-5-mini` (optional)

When enabled, the PDF generator attempts AI concept-card creation first and falls back to deterministic generation if AI fails.
