# And Then, It All Made Sense — reader

A public, no-account reading experience for Roqeebah Olaide Onigbanjo’s *And Then, It All Made Sense: A Love Letter to Struggling Students*. The complete default manuscript is bundled in `src/data/manuscript.json`; it was extracted from the supplied Word document with Mammoth and is shipped with the site. The cover artwork is the supplied front and back cover.

## Run the reader

From the repository root:

```sh
pnpm --filter @workspace/book-reader dev
```

The project uses the existing Vite/React scaffold. There is no backend, account, or payment flow.

## Reading features

- Use the chapter list to jump through the memoir, or choose **Begin reading**.
- Select **Find in book** (or press `/`) to search across manuscript paragraphs and the supplied back-cover biography. Press `Esc` to close search. Select a result to jump to its passage.
- Increase or decrease reading type with the `+` and `−` controls. Reading size and light/dark preference are saved in this browser.
- The reader is responsive and includes keyboard focus states, labelled controls, and reduced-motion support.

## Import a Word manuscript (beginner steps)

1. Open **Replace the manuscript** near the bottom of the reader.
2. Select a Microsoft Word `.docx` file. The document is parsed on your device by the `mammoth` package; it is not sent to a server.
3. Wait for the confirmation message, then search and read the new local preview.
4. Select **Download JSON** to export the current reader content, including the supplied Appreciation text.
5. Importing changes this browser tab only. Refresh the page to restore the complete bundled memoir.

Only `.docx` files up to 30 MB are accepted. Scanned pages without selectable text may not yield readable paragraphs. If parsing fails, open and re-save the document as `.docx`, then try again. The reader keeps text paragraphs and their order; advanced Word formatting, images, and page layout are not retained by the plain-text import.

To make an imported manuscript the default for everyone who visits the site, replace `artifacts/book-reader/src/data/manuscript.json` with the downloaded JSON and publish the updated site. The local import itself is not uploaded to the website.

## Updating the bundled default

Replace `src/data/manuscript.json` with the updated reader JSON, preserving its `title`, `subtitle`, `author`, `appreciation`, and ordered `paragraphs` fields. Keep the supplied cover assets in the project’s `attached_assets` directory. No social links should be added unless the author supplies them.
