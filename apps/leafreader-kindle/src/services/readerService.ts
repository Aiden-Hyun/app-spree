import { storageService } from "./storageService";
import * as FileSystem from "expo-file-system";

export interface BookContent {
  pages: string[];
  totalPages: number;
  metadata: {
    title?: string;
    author?: string;
    coverUrl?: string;
  };
}

export interface PageContent {
  text: string;
  pageNumber: number;
  chapter?: string;
}

export const readerService = {
  // Load book content
  async loadBookContent(
    bookId: string,
    fileUrl?: string
  ): Promise<BookContent> {
    try {
      // Check if book is downloaded locally
      const localUri = await storageService.getLocalBookUri(bookId);

      if (localUri) {
        // TODO: Implement actual EPUB/PDF parsing
        // For now, return sample content
        return this.generateSampleContent();
      } else if (fileUrl) {
        // Download book first
        await storageService.downloadBookFile(fileUrl, bookId);
        return this.generateSampleContent();
      } else {
        // Return sample content for demo
        return this.generateSampleContent();
      }
    } catch (error) {
      console.error("Error loading book content:", error);
      // Return sample content as fallback
      return this.generateSampleContent();
    }
  },

  // Get specific page content
  async getPageContent(
    bookId: string,
    pageNumber: number
  ): Promise<PageContent> {
    const content = await this.loadBookContent(bookId);
    const page = content.pages[pageNumber - 1] || "";

    return {
      text: page,
      pageNumber,
      chapter: this.getChapterForPage(pageNumber),
    };
  },

  // Generate sample content (placeholder until EPUB parser is implemented)
  generateSampleContent(): BookContent {
    const sampleChapters = [
      {
        title: "Chapter 1: The Beginning",
        content: `The story begins on a quiet morning in the small town of Willowbrook. Sarah walked down the cobblestone streets, her mind filled with thoughts of the adventure that lay ahead.

The sun cast long shadows across the ancient buildings, each one holding centuries of stories within their weathered walls. She paused at the old bookshop on the corner, its wooden sign creaking gently in the breeze.

"Today is the day," she whispered to herself, pushing open the heavy oak door. The familiar scent of old paper and leather bindings greeted her, a comforting embrace that felt like coming home.

Mr. Thompson looked up from behind the counter, his eyes twinkling behind wire-rimmed spectacles. "Ah, Sarah! I've been expecting you. The book you ordered has arrived."

Her heart raced as he reached beneath the counter, producing a leather-bound volume that seemed to pulse with an otherworldly energy. This was it—the key to everything she had been searching for.`,
      },
      {
        title: "Chapter 2: The Discovery",
        content: `The book felt heavier than it looked, its pages yellowed with age and filled with cryptic symbols that seemed to shift and dance before her eyes. Sarah spent hours poring over the ancient text, trying to decipher its meaning.

Late into the night, as the candle on her desk flickered and threatened to go out, she finally understood. The symbols weren't just writing—they were a map, a guide to something extraordinary hidden in plain sight.

She grabbed her coat and rushed out into the moonlit streets. The town looked different now, transformed by her newfound knowledge. Every shadow held a secret, every doorway a potential portal to another world.

Following the instructions from the book, she made her way to the old cathedral at the heart of Willowbrook. Its spires reached toward the stars, and as she approached, she could feel the air itself thrumming with ancient power.

The heavy doors swung open at her touch, revealing a vast interior lit by thousands of candles. And there, at the altar, stood a figure she had only seen in her dreams.`,
      },
      {
        title: "Chapter 3: The Guardian",
        content: `"Welcome, Sarah," the figure said, its voice echoing through the cathedral like a distant thunder. "I am the Guardian of the Threshold, and you have been chosen."

Sarah's breath caught in her throat. Everything the book had promised was true. The legends, the myths, the whispered stories passed down through generations—all of it was real.

"Chosen for what?" she managed to ask, her voice barely above a whisper.

The Guardian smiled, a expression both ancient and kind. "To bridge the worlds, to restore what was lost, and to protect what must be preserved. But first, you must prove yourself worthy."

Three trials awaited her, each more challenging than the last. The Guardian explained them carefully: the Trial of Courage, where she would face her deepest fears; the Trial of Wisdom, where knowledge alone could save her; and the Trial of Heart, where she must choose between what she desired most and what the world needed.

"Are you ready to begin?" the Guardian asked.

Sarah took a deep breath, thinking of all that had led her to this moment. The years of searching, the countless dead ends, the moments of doubt—they all faded away. She was here now, and she would not turn back.

"I'm ready," she said, and stepped forward into her destiny.`,
      },
    ];

    // Split chapters into pages (roughly 300 words per page)
    const pages: string[] = [];
    const wordsPerPage = 300;

    sampleChapters.forEach((chapter) => {
      const words = chapter.content.split(" ");
      let currentPage = chapter.title + "\n\n";
      let wordCount = 0;

      words.forEach((word) => {
        currentPage += word + " ";
        wordCount++;

        if (wordCount >= wordsPerPage) {
          pages.push(currentPage.trim());
          currentPage = "";
          wordCount = 0;
        }
      });

      if (currentPage.trim()) {
        pages.push(currentPage.trim());
      }
    });

    return {
      pages,
      totalPages: pages.length,
      metadata: {
        title: "The Chronicles of Willowbrook",
        author: "Alexandra Sterling",
      },
    };
  },

  // Get chapter for a given page
  getChapterForPage(pageNumber: number): string {
    // Simple chapter calculation for demo
    if (pageNumber <= 3) return "Chapter 1: The Beginning";
    if (pageNumber <= 6) return "Chapter 2: The Discovery";
    if (pageNumber <= 9) return "Chapter 3: The Guardian";
    return `Chapter ${Math.floor(pageNumber / 3) + 1}`;
  },

  // Parse EPUB file (placeholder for future implementation)
  async parseEpub(fileUri: string): Promise<BookContent> {
    // TODO: Implement actual EPUB parsing using epub.js or similar
    console.log("EPUB parsing not yet implemented");
    return this.generateSampleContent();
  },

  // Parse PDF file (placeholder for future implementation)
  async parsePdf(fileUri: string): Promise<BookContent> {
    // TODO: Implement actual PDF parsing using pdf.js or similar
    console.log("PDF parsing not yet implemented");
    return this.generateSampleContent();
  },

  // Parse plain text file
  async parseTxt(fileUri: string): Promise<BookContent> {
    try {
      const content = await FileSystem.readAsStringAsync(fileUri);
      const words = content.split(/\s+/);
      const wordsPerPage = 300;
      const pages: string[] = [];

      let currentPage = "";
      let wordCount = 0;

      words.forEach((word) => {
        currentPage += word + " ";
        wordCount++;

        if (wordCount >= wordsPerPage) {
          pages.push(currentPage.trim());
          currentPage = "";
          wordCount = 0;
        }
      });

      if (currentPage.trim()) {
        pages.push(currentPage.trim());
      }

      return {
        pages,
        totalPages: pages.length,
        metadata: {},
      };
    } catch (error) {
      console.error("Error parsing text file:", error);
      return this.generateSampleContent();
    }
  },
};


