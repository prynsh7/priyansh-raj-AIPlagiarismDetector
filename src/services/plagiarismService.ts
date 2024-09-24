import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

export interface PlagiarismCheckResult {
  percentage: number;
  flaggedSections: {
    section_title: string;
    details: string;
  }[];
}

export interface SubmitDocumentResponse {
  plagarismReport: PlagiarismCheckResult;
}

export interface CheckStatusResponse {
  status: "pending" | "completed" | "failed";
  result?: PlagiarismCheckResult;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

class PlagiarismService {
  private openAIApiKey =  import.meta.env.VITE_OPENAI_API_KEY 


  
  async submitDocument(file: File): Promise<PlagiarismCheckResult> {
    const text = await this.extractTextFromFile(file);

    const plagiarismResult = await this.checkPlagiarismWithOpenAI(text);

    return plagiarismResult;
  }

  private async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);

        try {
          const pdf = await pdfjs.getDocument(typedArray).promise;

          let extractedText = "";

          // Extract text from each page of the PDF
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(" ");

            extractedText += pageText + "\n";
          }

          resolve(extractedText);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file); // Read the file as binary for PDFs
    });
  }

  private async checkPlagiarismWithOpenAI(
    text: string
  ): Promise<PlagiarismCheckResult> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.openAIApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a Plagiarism Checker, specializing in detecting and preventing plagiarism in written content. Analyze the following text for potential plagiarism. Provide a plagiarism percentage and list any sections that appear to be plagiarized.",
          },
          {
            role: "user",
            content: `
            content to check for plagiarism
            
            ${text}  
            
            Response format:

Plagiarism Percentage: <percentage>

Sections Appearing to be Plagiarized:
1. <Title of the first section>
   <Detailed description of plagiarized content in this section>
2. <Title of the second section>
   <Detailed description of plagiarized content in this section>

Conclusion: <Final analysis or summary>`,
          },
        ],
        temperature: 1,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        response_format: {
          type: "text",
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to check plagiarism");
    }

    const data: OpenAIResponse = await response.json();

    const content = data.choices[0].message.content;

    const { percentage, flaggedSections } = await this.extractPlagiarismData(
      content
    );

    return { percentage, flaggedSections };
  }

  private async extractPlagiarismData(text: string) {
    // Extract the plagiarism percentage
    const percentageMatch = text.match(/Plagiarism Percentage:\s*(\d+%)/i);

    // Extract the sections appearing to be plagiarized
    const sectionsMatch = text.match(
      /Sections Appearing to be Plagiarized:\s*([\s\S]*?)(Conclusion:|$)/i
    );

    let flaggedSections = [];
    if (sectionsMatch) {
      // Split the sections by numbers (1., 2., 3.) and filter out empty entries
      const sections = sectionsMatch[1]
        .trim()
        .split(/\d+\.\s+/)
        .filter(Boolean);

      flaggedSections = sections.map((section) => {
        // Split section into title and details
        const [title, ...details] = section.split("\n").filter(Boolean);
        return {
          section_title: title.trim(),
          details: details.join("\n").trim(),
        };
      });
    }

    // Extract the conclusion
    const conclusionMatch = text.match(/Conclusion:\s*([\s\S]*)/i);
    const conclusion = conclusionMatch ? conclusionMatch[1].trim() : "";

    return {
      percentage: percentageMatch ? percentageMatch[1] : "N/A",
      flaggedSections: flaggedSections,
      conclusion: conclusion,
    };
  }
}

export default new PlagiarismService();
