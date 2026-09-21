# Chorus method cards

## share-preview-metadata-validation

Freeze the canonical local page, content state, locale, viewport if relevant, and parser requirements. Inspect title, description, canonical identity, preview image URL and dimensions, alternate text or text fallback, content type, cache hints, and any platform-specific field only when the declared parser requires it. Keep page source, rendered output, and parser interpretation separate.

Build a parser matrix with required field, observed value, expected value, parser result, evidence locator, and severity. Test a complete fixture, missing title or description, relative or inaccessible image, wrong dimensions or content type, stale cache marker, and a page with intentionally absent optional fields. Confirm that the preview asset is the intended local file and that the fallback remains understandable without the image.

Return validated metadata, parser evidence, image evidence, unresolved platform behavior, and the exact local edits or handoff needed. This route can repair local metadata when authorized; it does not scrape accounts, publish a page, or treat one parser's success as universal share behavior.
